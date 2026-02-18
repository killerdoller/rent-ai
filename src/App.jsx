import React, { useState } from 'react';
import './index.css';

const properties = [
  {
    id: 1,
    title: "Luxury Modern Villa",
    location: "Medellín, Colombia",
    price: "$2,500,000",
    beds: 4,
    baths: 5,
    area: "450m²",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Penthouse at the Coast",
    location: "Cartagena, Colombia",
    price: "$1,800,000",
    beds: 3,
    baths: 3,
    area: "210m²",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "Eco-Chalet Forest",
    location: "Guatapé, Colombia",
    price: "$950,000",
    beds: 2,
    baths: 2,
    area: "120m²",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800"
  }
];

function App() {
  const [search, setSearch] = useState("");

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="container" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rent<span style={{ color: 'var(--primary)' }}>AI</span></h1>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Rent</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Buy</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Sell</a>
        </div>
        <button className="btn btn-primary">Sign In</button>
      </nav>

      {/* Hero Section */}
      <section className="hero container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 className="fade-in" style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
          Encuentra el hogar de <br />
          <span style={{ color: 'var(--primary)' }}>tus sueños</span> con AI.
        </h2>
        <p className="fade-in" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', marginInline: 'auto' }}>
          La plataforma más avanzada para renta, compra y venta de bienes raíces en Colombia.
        </p>
        
        <div className="glass fade-in" style={{ padding: '1.5rem', maxWidth: '800px', marginInline: 'auto', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="¿A dónde quieres mudarte?" 
            style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '1rem', outline: 'none' }}
          />
          <button className="btn btn-primary">Buscar</button>
        </div>
      </section>

      {/* Listings Grid */}
      <main className="container" style={{ paddingBottom: '8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Propiedades destacadas</h3>
            <p style={{ color: 'var(--text-muted)' }}>Explora las mejores opciones elegidas para ti</p>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
            Ver todas →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {properties.map(prop => (
            <div key={prop.id} className="glass" style={{ overflow: 'hidden', transition: 'transform 0.3s ease' }} 
                 onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src={prop.image} alt={prop.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>{prop.price}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{prop.area}</span>
                </div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{prop.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>📍 {prop.location}</p>
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>🛏️ {prop.beds} Beds</span>
                  <span>🚿 {prop.baths} Baths</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: 'rgba(0,0,0,0.3)', padding: '5rem 2rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Rent<span style={{ color: 'var(--primary)' }}>AI</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>© 2026 Rent AI - Tu aliado en Finca Raíz.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
