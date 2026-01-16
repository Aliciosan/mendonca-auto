import { useState, useEffect } from 'react';
import { useAuto } from '../context/AutoContext';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, Plus, UserPlus, FileText, Trash, CloudUpload, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';
import CarCard from '../components/CarCard';
import Modal from '../components/Modal';

// Som de notificação
const notificationSound = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export default function ManagerDashboard() {
  const { 
    cars, clients, sales, appointments, notifications = [], // Garante array vazio se undefined
    addCar, updateCar, deleteCar, markSold, 
    registerClient, deleteClient, deleteAppointment, 
    clearNotifications, markNotificationsAsRead, 
    resetAll, logout 
  } = useAuto();
  
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [carForm, setCarForm] = useState({ id: null, brand: '', model: '', year: '', price: '', color: '', km: '', image: null });
  const [clientForm, setClientForm] = useState({ name: '', cpf: '', email: '', phone: '' });

  // Conta notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // OUVINTE DE SOM DE NOTIFICAÇÃO
  useEffect(() => {
    const channel = new BroadcastChannel('mendonca_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_APPOINTMENT_ALERT') {
        // Toca o som
        const audio = new Audio(notificationSound);
        audio.play().catch(e => console.log("Som bloqueado:", e));
        
        // Mostra o Toast
        toast.message('🔔 Novo Agendamento!', {
          description: `Cliente ${event.data.data.clientName} agendou visita.`,
          duration: 5000,
          action: { label: 'Ver Agenda', onClick: () => setActiveModal('agenda') },
        });
      }
    };
    return () => channel.close();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  
  const openNotifications = () => { setActiveModal('notifications'); markNotificationsAsRead(); };
  
  const openCarModal = (car = null) => {
    setCarForm(car || { id: null, brand: '', model: '', year: '', price: '', color: '', km: '', image: null });
    setActiveModal('car');
  };

  const handleCarSubmit = (e) => {
    e.preventDefault();
    const data = { ...carForm, price: Number(carForm.price) };
    if (data.id) updateCar(data); else addCar(data);
    setActiveModal(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCarForm({ ...carForm, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    registerClient(clientForm);
    setClientForm({ name: '', cpf: '', email: '', phone: '' });
    setActiveModal(null);
  };

  const formatDate = (d) => d ? d.split('-').reverse().join('/') : '-';

  return (
    <div>
      <header style={{ background: 'white', padding: '15px 0', borderBottom: '2px solid #d4af37', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
            <Shield color="#d4af37" /> Área Administrativa
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* BOTÃO SININHO */}
            <button onClick={openNotifications} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
              <Bell size={24} color="#64748b" />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
            </button>
            <button className="btn btn-outline" onClick={handleLogout}><LogOut size={16}/> Sair</button>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <button className="btn btn-primary" onClick={() => openCarModal()}><Plus size={18}/> Veículo</button>
          <button className="btn btn-outline" onClick={() => setActiveModal('client')}><UserPlus size={18}/> Cliente</button>
          <button className="btn btn-outline" onClick={() => setActiveModal('agenda')}>
            <Calendar size={18} color={appointments?.length > 0 ? '#d4af37' : 'currentColor'} /> 
            Agenda {appointments?.length > 0 && `(${appointments.length})`}
          </button>
          <button className="btn btn-outline" onClick={() => setActiveModal('history')}><FileText size={18}/> Vendas</button>
          <button className="btn btn-danger" onClick={resetAll} style={{ marginLeft: 'auto' }}><Trash size={18}/> Reset</button>
        </div>

        <h3 style={{ marginBottom: '15px', borderLeft: '4px solid #d4af37', paddingLeft: '10px' }}>Estoque Atual</h3>
        <div className="car-grid">
          {cars?.map(car => <CarCard key={car.id} car={car} isManager={true} onEdit={openCarModal} onDelete={deleteCar} onSell={markSold} />)}
        </div>

        <h3 style={{ marginTop: '50px', marginBottom: '15px', borderLeft: '4px solid #d4af37', paddingLeft: '10px' }}>Clientes Cadastrados</h3>
        <div className="table-wrapper">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Nome</th><th>CPF</th><th>Email</th><th>Telefone</th><th>Ações</th></tr></thead>
              <tbody>
                {clients?.map((c, i) => <tr key={c.id || i}><td><strong>{c.name}</strong></td><td>{c.cpf}</td><td>{c.email}</td><td>{c.phone}</td><td><button className="btn btn-danger" onClick={() => deleteClient(c.id)}><Trash size={14}/></button></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAIS --- */}
      
      {/* 1. AGENDA */}
      {activeModal === 'agenda' && (
        <Modal title="Agenda de Visitas" onClose={() => setActiveModal(null)}>
          <div className="table-wrapper" style={{ marginTop: 0 }}>
             <table style={{ minWidth: '500px' }}>
               <thead><tr><th>Cliente</th><th>Contato</th><th>Carro</th><th>Data/Hora</th><th>Ação</th></tr></thead>
               <tbody>
                 {!appointments || appointments.length === 0 ? (
                   <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma visita agendada.</td></tr>
                 ) : (
                   appointments.map((a) => (
                     <tr key={a.id}>
                       <td><strong>{a.client_name || a.clientName}</strong></td>
                       <td>{a.client_phone || a.clientPhone}</td>
                       <td>{a.car_brand || a.carBrand} {a.car_model || a.carModel}</td>
                       <td>{formatDate(a.date)} às {a.time}</td>
                       <td><button className="btn btn-danger" onClick={() => deleteAppointment(a.id)}><Trash size={14}/></button></td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </Modal>
      )}

      {/* 2. NOTIFICAÇÕES */}
      {activeModal === 'notifications' && (
        <Modal title="Notificações" onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}><button className="btn btn-outline" onClick={clearNotifications}>Limpar</button></div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8'}}>Nenhuma notificação.</p> : notifications.map(n => (
              <div key={n.id} style={{ padding: '15px', borderRadius: '8px', marginBottom: '10px', background: n.type === 'alert' ? '#fff7ed' : '#f8fafc', borderLeft: `4px solid ${n.type === 'alert' ? '#f59e0b' : '#3b82f6'}` }}>
                <p style={{ fontWeight: '500', color: '#334155' }}>{n.text}</p><small style={{ color: '#94a3b8' }}>{n.date}</small>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Outros modais mantidos padrão (Carro, Cliente, Histórico) */}
      {activeModal === 'car' && (
        <Modal title={carForm.id ? "Editar" : "Cadastrar"} onClose={() => setActiveModal(null)}>
          <form onSubmit={handleCarSubmit}>
            <div 
              style={{ width: '100%', height: '200px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden' }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {carForm.image ? <img src={carForm.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#94a3b8' }}><CloudUpload size={30} color="#d4af37" /><br/>Foto</div>}
            </div>
            <input type="file" id="file-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            <div className="form-row"><div className="form-group"><label>Marca</label><input required value={carForm.brand} onChange={e => setCarForm({...carForm, brand: e.target.value})}/></div><div className="form-group"><label>Modelo</label><input required value={carForm.model} onChange={e => setCarForm({...carForm, model: e.target.value})}/></div></div>
            <div className="form-row"><div className="form-group"><label>Ano</label><input required value={carForm.year} onChange={e => setCarForm({...carForm, year: e.target.value})}/></div><div className="form-group"><label>Preço</label><input required value={carForm.price} onChange={e => setCarForm({...carForm, price: e.target.value})}/></div></div>
            <div className="form-row"><div className="form-group"><label>Cor</label><input required value={carForm.color} onChange={e => setCarForm({...carForm, color: e.target.value})}/></div><div className="form-group"><label>Km</label><input required value={carForm.km} onChange={e => setCarForm({...carForm, km: e.target.value})}/></div></div>
             <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Salvar</button>
          </form>
        </Modal>
      )}
      
      {activeModal === 'client' && (
         <Modal title="Cliente" onClose={() => setActiveModal(null)}>
           <form onSubmit={handleClientSubmit}>
             <input placeholder="Nome" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} style={{marginBottom: '10px'}}/>
             <input placeholder="CPF" required value={clientForm.cpf} onChange={e => setClientForm({...clientForm, cpf: e.target.value})} style={{marginBottom: '10px'}}/>
             <input placeholder="Email" required value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} style={{marginBottom: '10px'}}/>
             <input placeholder="Telefone" required value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} style={{marginBottom: '10px'}}/>
             <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Salvar</button>
           </form>
         </Modal>
      )}

      {activeModal === 'history' && (
         <Modal title="Vendas" onClose={() => setActiveModal(null)}>
           <div className="table-wrapper"><table><thead><tr><th>Carro</th><th>Valor</th><th>Cliente</th></tr></thead><tbody>{sales?.map((s,i) => <tr key={i}><td>{s.car_model || s.carModel}</td><td>{s.price}</td><td>{s.client_name || s.clientName}</td></tr>)}</tbody></table></div>
         </Modal>
      )}
    </div>
  );
}