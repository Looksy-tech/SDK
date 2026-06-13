import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { products } from "./products";

function ProductCard({ product }) {
  return (
    <article className="card">
      <Link to={`/${product.id}`} className="card-link">
        <img src={product.image} alt={product.name} className="card-image" />
        <h2 className="card-title">{product.name}</h2>
        <p className="card-price">{product.price}</p>
      </Link>
    </article>
  );
}

function CatalogPage() {
  return (
    <main className="page">
      <h1>Catalog</h1>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}

function ProductPage({ product }) {
  return (
    <main className="page">
      <Link className="back-link" to="/">
        Back to catalog
      </Link>
      <div className="product-layout">
        <div
          className="product-media"
          data-fitting-product
          data-fitting-name={product.name}
          data-fitting-price={product.price}
          data-fitting-image={product.tryOnImage}
        >
          <img
            className="product-image"
            src={product.image}
            alt={product.name}
            data-fitting-image={product.tryOnImage}
          />
        </div>
        <div>
          <h1>{product.name}</h1>
          <p className="product-price">{product.price}</p>
          <p className="product-description">{product.description}</p>
        </div>
      </div>
    </main>
  );
}

function useLooksyInitOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (window.VirtualFitting) {
        window.VirtualFitting.init();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);
}

function setupAddToCartBridge() {}

export default function App() {
  useLooksyInitOnRouteChange();
  setupAddToCartBridge();

  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/product1" element={<ProductPage product={products[0]} />} />
      <Route path="/product2" element={<ProductPage product={products[1]} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
