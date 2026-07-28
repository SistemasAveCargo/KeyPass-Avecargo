import React, { useState, useEffect } from 'react';
import { Key, Lock, Mail, Plus, Trash2, Edit, ExternalLink, Copy, Eye, EyeOff, LogOut, Search, Download } from 'lucide-react';

// URL de tu API de Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxfpbg_HC_azH8luzAKUyI9Q8yexTB9mICUr3vkn4bnkk7c8wUdDfsrXwmrvPfS_zbU/exec"; 

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y DATOS ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // --- ESTADOS DE MODAL Y FORMULARIO ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [visiblePass, setVisiblePass] = useState({});
  const [form, setForm] = useState({ 
    aplicacion: '', 
    usuario: '', 
    contrasena: '', 
    url: '', 
    descripcion: '' 
  });

  // --- ESTADO Y EVENTO PWA (INSTALACIÓN) ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- CONEXIÓN API (Google Apps Script) ---
  const apiCall = async (data) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (error) {
      console.error("Error en la petición API:", error);
      return { success: false, message: "Error al conectar con el servidor." };
    }
  };

  // --- MÉTODOS CRUD Y ACCIONES ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall({ action: 'login', email, password });
    setLoading(false);
    
    if (res.success) {
      setUser(res.user);
      loadPasswords();
    } else {
      alert(res.message || "Error al iniciar sesión.");
    }
  };

  const loadPasswords = async () => {
    setLoading(true);
    const res = await apiCall({ action: 'getPasswords' });
    setLoading(false);
    if (res.success) {
      setPasswords(res.data || []);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = editingItem ? { ...form, id: editingItem.id } : form;
    
    const res = await apiCall({ action: 'savePassword', item: payload });
    setLoading(false);
    
    if (res.success) {
      setModalOpen(false);
      setForm({ aplicacion: '', usuario: '', contrasena: '', url: '', descripcion: '' });
      setEditingItem(null);
      loadPasswords();
    } else {
      alert("Error al guardar el registro.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta contraseña?")) {
      setLoading(true);
      await apiCall({ action: 'deletePassword', id });
      loadPasswords();
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm(item);
    setModalOpen(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const toggleVisibility = (id) => {
    setVisiblePass((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrado de la lista en tiempo real
  const filteredPasswords = passwords.filter(p => 
    p.aplicacion.toLowerCase().includes(search.toLowerCase()) ||
    p.usuario.toLowerCase().includes(search.toLowerCase()) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  // ==========================================
  // VISTA 1: INICIO DE SESIÓN (LOGIN)
  // ==========================================
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Key size={40} color="#D3131A" />
            <h2 style={{ marginTop: '10px' }}>Ave<span style={{ color: '#D3131A' }}>Cargo</span></h2>
            <p style={{ color: '#666', fontSize: '14px' }}>KeyPass Vault</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="usuario@avecargo.com" 
              />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: APLICACIÓN PRINCIPAL (VAULT)
  // ==========================================
  return (
    <div>
      {/* Barra de Navegación Superior */}
      <nav style={{ background: 'white', borderBottom: '3px solid #D3131A', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Ave<span style={{ color: '#D3131A' }}>Cargo</span> <small style={{ fontSize: '12px', color: '#666' }}>KeyPass</small></h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {deferredPrompt && (
              <button className="btn btn-primary" onClick={handleInstallClick}>
                <Download size={16} /> Instalar App
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setUser(null)}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <div className="container" style={{ marginTop: '20px' }}>
        
        {/* Controles: Búsqueda y Agregar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Buscar por aplicación, usuario o notas..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} 
          />
          <button 
            className="btn btn-primary" 
            onClick={() => { 
              setEditingItem(null); 
              setForm({ aplicacion: '', usuario: '', contrasena: '', url: '', descripcion: '' }); 
              setModalOpen(true); 
            }}
          >
            <Plus size={18} /> Nueva Contraseña
          </button>
        </div>

        {loading && <p style={{ textAlign: 'center', margin: '20px 0' }}>Cargando registros...</p>}

        {/* Tarjetas de Contraseñas (Grid Responsivo) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {filteredPasswords.map((item) => (
            <div className="card" key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                  {item.aplicacion}
                </strong>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 8px' }}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openEdit(item)}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'red' }} onClick={() => handleDelete(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px', minHeight: '18px' }}>
                {item.descripcion || 'Sin descripción'}
              </p>

              {/* Usuario */}
              <div style={{ background: '#F8F9FA', padding: '8px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.usuario}</span>
                <Copy size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => copyToClipboard(item.usuario)} />
              </div>

              {/* Contraseña */}
              <div style={{ background: '#F8F9FA', padding: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                  {visiblePass[item.id] ? item.contrasena : '••••••••'}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {visiblePass[item.id] ? 
                    <EyeOff size={14} style={{ cursor: 'pointer' }} onClick={() => toggleVisibility(item.id)} /> : 
                    <Eye size={14} style={{ cursor: 'pointer' }} onClick={() => toggleVisibility(item.id)} />
                  }
                  <Copy size={14} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard(item.contrasena)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredPasswords.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
            <p>No se encontraron registros de contraseñas.</p>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL PARA CREAR Y EDITAR                  */}
      {/* ========================================== */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingItem ? 'Editar Contraseña' : 'Nueva Contraseña'}</h3>
            <form onSubmit={handleSave} style={{ marginTop: '15px' }}>
              <div className="input-group">
                <label>Aplicación o Sitio Web *</label>
                <input 
                  required 
                  value={form.aplicacion} 
                  onChange={e => setForm({ ...form, aplicacion: e.target.value })} 
                  placeholder="Ej. Gmail, ERP, Banco" 
                />
              </div>
              <div className="input-group">
                <label>Usuario o Correo *</label>
                <input 
                  required 
                  value={form.usuario} 
                  onChange={e => setForm({ ...form, usuario: e.target.value })} 
                  placeholder="ejemplo@avecargo.com" 
                />
              </div>
              <div className="input-group">
                <label>Contraseña *</label>
                <input 
                  required 
                  value={form.contrasena} 
                  onChange={e => setForm({ ...form, contrasena: e.target.value })} 
                />
              </div>
              <div className="input-group">
                <label>URL / Enlace (Opcional)</label>
                <input 
                  type="url" 
                  value={form.url} 
                  onChange={e => setForm({ ...form, url: e.target.value })} 
                  placeholder="https://ejemplo.com" 
                />
              </div>
              <div className="input-group">
                <label>Notas / Descripción</label>
                <textarea 
                  rows="2" 
                  value={form.descripcion} 
                  onChange={e => setForm({ ...form, descripcion: e.target.value })} 
                  placeholder="Detalles adicionales..." 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}