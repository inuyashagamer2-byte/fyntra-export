"use client";

import React, { useState } from "react";
import { 
  Package, 
  Upload, 
  Sparkles, 
  Plus, 
  Send, 
  Trash2, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { enrichProductAction } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { exportAll, type Product } from "@/lib/marketplaces";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    image: null as string | null,
    description: "",
    category: "",
    price: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnrich = async () => {
    if (!formData.name) {
      alert("Por favor, insira o nome do produto.");
      return;
    }

    setLoading(true);
    try {
      // Remove data:image/...;base64, prefix for Gemini
      const base64Image = formData.image?.split(",")[1];
      const result = await enrichProductAction(formData.name, base64Image);
      
      if (result) {
        setFormData((prev) => ({
          ...prev,
          description: result.description,
          category: result.category,
          price: result.suggestedPrice.toString(),
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enriquecer com IA. Verifique sua chave de API.");
    } finally {
      setLoading(false);
    }
  };

  const addToInventory = () => {
    if (!formData.name || !formData.description) {
      alert("Preencha ao menos o nome e a descrição.");
      return;
    }

    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
    };

    setProducts([...products, newProduct]);
    setFormData({
      name: "",
      image: null,
      description: "",
      category: "",
      price: "",
    });
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleExport = async () => {
    if (products.length === 0) {
      alert("Adicione produtos antes de exportar.");
      return;
    }

    setExporting(true);
    try {
      await exportAll(products);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Falha ao exportar alguns produtos. Verifique o console para mais detalhes.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Fyntra Export</h1>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting || products.length === 0}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {exportSuccess ? "Exportado!" : "Exportar para Marketplaces"}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Panel - Add Product */}
        <div className="md:col-span-4 bg-white p-6 rounded-xl border shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-4">Adicionar Novo Item</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Câmera DSLR Canon"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem do Produto
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <div className="text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Upload de imagem</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleEnrich}
              disabled={loading || !formData.name}
              className="w-full py-2 px-4 border border-blue-200 rounded-lg text-blue-600 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Enriquecer com IA
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Sugerido (R$)
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={addToInventory}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar ao Inventário
            </button>
          </div>
        </div>

        {/* Right Panel - Product List */}
        <div className="md:col-span-8 bg-white p-6 rounded-xl border shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Seus Produtos</h2>
            <span className="text-sm text-gray-500">{products.length} itens no total</span>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <Package className="w-16 h-16 mb-4 opacity-20" />
              <p>Nenhum produto adicionado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-xl p-4 flex gap-4 relative group">
                  <button 
                    onClick={() => removeProduct(product.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="text-gray-300 w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {product.category}
                      </span>
                      <span className="font-bold text-blue-600">R$ {product.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
