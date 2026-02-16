"use server";

export interface Product {
  id: string;
  name: string;
  image: string | null; // deve ser URL pública (não base64)
  description: string;
  category: string;
  price: string; // "199.90"
}

/**
 * Mercado Livre NÃO aceita imagem em base64 no campo pictures.source.
 * Você deve enviar uma URL pública (https://...) ou fazer upload separado e usar o id.
 */
function ensurePublicImageUrl(image: string) {
  const trimmed = image.trim();

  // bloqueia data URL (base64)
  if (trimmed.startsWith("data:")) {
    throw new Error(
      "Imagem em base64 detectada. O Mercado Livre não aceita base64 em pictures.source. Envie uma URL pública (https://...) da imagem."
    );
  }

  // valida url
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("URL de imagem inválida: precisa começar com http(s).");
    }
  } catch {
    throw new Error("URL de imagem inválida. Envie uma URL pública (https://...).");
  }

  return trimmed;
}

function clampText(s: string, max = 4000) {
  const text = (s ?? "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

async function readErrorBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  } catch {
    return null;
  }
}

function getRequiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Environment Variable ausente: ${name}`);
  return v;
}

/**
 * EXPORTA PARA MERCADO LIVRE
 * Requer: MERCADO_LIVRE_ACCESS_TOKEN (Bearer)
 */
export async function exportToMercadoLivre(product: Product) {
  const accessToken = getRequiredEnv("MERCADO_LIVRE_ACCESS_TOKEN");

  // TODO: mapear corretamente product.category -> category_id real (MLBxxxx)
  // Por enquanto, deixe uma categoria válida do seu nicho.
  const categoryId = "MLB1430"; // EXEMPLO: eletrônicos (troque pela sua)

  const pictures =
    product.image && product.image.trim()
      ? [{ source: ensurePublicImageUrl(product.image) }]
      : [];

  const body = {
    title: product.name,
    category_id: categoryId,
    price: Number.parseFloat(product.price),
    currency_id: "BRL",
    available_quantity: 1,
    buying_mode: "buy_it_now",
    condition: "new",
    listing_type_id: "gold_special",
    // Alguns fluxos do ML usam descrição em endpoint separado.
    // Mantendo aqui, mas limitando tamanho para evitar payload enorme.
    description: { plain_text: clampText(product.description, 4000) },
    pictures,
  };

  const endpoint = "https://api.mercadolibre.com/items";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    console.error("Mercado Livre error:", res.status, errBody);
    throw new Error(
      `Mercado Livre ${res.status} (${res.statusText}): ${typeof errBody === "string" ? errBody : JSON.stringify(errBody)}`
    );
  }

  return await res.json();
}

/**
 * SHOPEE: aqui ainda está mock (a Shopee exige assinatura/partner auth).
 * Mantive, mas removi "sucesso simulado" pra não mascarar erro.
 */
export async function exportToShopee(product: Product) {
  const partnerId = getRequiredEnv("SHOPEE_PARTNER_ID");
  const endpoint = "https://partner.shopeemobile.com/api/v2/product/add_item";

  const body = {
    item_name: product.name,
    description: clampText(product.description, 3000),
    category_id: 100001,
    brand: { brand_id: 0 },
    original_price: Number.parseFloat(product.price),
    stock_info_v2: {
      summary_info: {
        total_reserved_stock: 0,
        total_available_stock: 1,
      },
    },
    image: { image_id_list: [] },
  };

  const res = await fetch(`${endpoint}?partner_id=${partnerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    console.error("Shopee error:", res.status, errBody);
    throw new Error(
      `Shopee ${res.status} (${res.statusText}): ${typeof errBody === "string" ? errBody : JSON.stringify(errBody)}`
    );
  }

  return await res.json();
}

export async function exportAll(products: Product[]) {
  const results = await Promise.allSettled(
    products.map(async (product) => {
      const [ml, shopee] = await Promise.allSettled([
        exportToMercadoLivre(product),
        exportToShopee(product),
      ]);

      return {
        product: product.name,
        ml: ml.status === "fulfilled" ? ml.value : { error: String(ml.reason) },
        shopee: shopee.status === "fulfilled" ? shopee.value : { error: String(shopee.reason) },
      };
    })
  );

  return results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) }));
}
