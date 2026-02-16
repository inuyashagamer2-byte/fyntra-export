"use server";

export interface Product {
  id: string;
  name: string;
  image: string | null;
  description: string;
  category: string;
  price: string;
}

export async function exportToMercadoLivre(product: Product) {
  // Placeholder for Mercado Livre API integration
  // Doc: https://developers.mercadolibre.com.ar/es_ar/publica-productos
  const endpoint = "https://api.mercadolibre.com/items";
  const accessToken = process.env.MERCADO_LIVRE_ACCESS_TOKEN || "PLACEHOLDER_TOKEN";

  const body = {
    title: product.name,
    category_id: "MLB1234", // Should be mapped from product.category
    price: parseFloat(product.price),
    currency_id: "BRL",
    available_quantity: 1,
    condition: "new",
    listing_type_id: "gold_special",
    description: {
      plain_text: product.description,
    },
    pictures: product.image ? [{ source: product.image }] : [],
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error exporting to Mercado Livre: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    // For demo purposes, we return a simulated success if it's a placeholder token
    if (accessToken === "PLACEHOLDER_TOKEN") {
      return { status: "simulated_success", marketplace: "Mercado Livre" };
    }
    throw error;
  }
}

export async function exportToShopee(product: Product) {
  // Placeholder for Shopee API integration
  // Doc: https://open.shopee.com/documents/v2/v2.product.add_item?module=2&type=1
  const endpoint = "https://partner.shopeemobile.com/api/v2/product/add_item";
  const partnerId = process.env.SHOPEE_PARTNER_ID || "PLACEHOLDER_ID";

  // Shopee API requires complex signing, which we'll mock here
  const body = {
    item_name: product.name,
    description: product.description,
    category_id: 100001, // Should be mapped
    brand: {
      brand_id: 0,
    },
    original_price: parseFloat(product.price),
    stock_info_v2: {
      summary_info: {
        total_reserved_stock: 0,
        total_available_stock: 1,
      },
    },
    image: {
      image_id_list: [], // Should upload image first
    },
  };

  try {
    // In a real scenario, we would add auth parameters (partner_id, timestamp, access_token, sign)
    const response = await fetch(`${endpoint}?partner_id=${partnerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error exporting to Shopee: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    if (partnerId === "PLACEHOLDER_ID") {
      return { status: "simulated_success", marketplace: "Shopee" };
    }
    throw error;
  }
}

export async function exportAll(products: Product[]) {
  const results = [];
  for (const product of products) {
    const ml = await exportToMercadoLivre(product);
    const shopee = await exportToShopee(product);
    results.push({ product: product.name, ml, shopee });
  }
  return results;
}
