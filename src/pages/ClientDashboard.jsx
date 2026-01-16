import { useState } from 'react';
import { useAuto } from '../context/AutoContext';
import { useNavigate } from 'react-router-dom';
import { Car, LogOut, Calendar, MessageCircle, Heart, Calculator } from 'lucide-react';
import CarCard from '../components/CarCard';
import Modal from '../components/Modal';

export default function ClientDashboard() {
  const { cars, user, logout, addAppointment, favorites } = useAuto();
  const navigate = useNavigate();
  
  const [searchBrand, setSearchBrand] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  const [selectedCar, setSelectedCar] = useState(null);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
  const [entryValue, setEntryValue] = useState('');
  const [installments, setInstallments] = useState(48);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleInterestClick = (car) => {
    setSelectedCar(car);
    setScheduleData({ date: '', time: '' });
    setEntryValue((car.price * 0.3).toFixed(2));
  };

  const closeInterestModal = () => setSelectedCar(null);

  const sendSimpleMessage = () => {
    if (!selectedCar) return;
    const msg = `Olá! Sou ${user?.name || 'Cliente'}. Tenho interesse no ${selectedCar.brand} ${selectedCar.model}.`;
    window.open(`https://wa.me/557999999999?text=${encodeURIComponent(msg)}`, '_blank');
    closeInterestModal();
  };

  const sendScheduleMessage = (e) => {
    e.preventDefault();
    if (!selectedCar || !scheduleData.date || !scheduleData.time) {
      alert("Selecione data e hora"); 
      return;
    }
    
    addAppointment({
      id: Date.now(),
      clientName: user?.name || 'Cliente Site',
      clientPhone: user?.phone || 'Sem fone',
      carBrand: selectedCar.brand,
      carModel: selectedCar.model,
      date: scheduleData.date,
      time: scheduleData.time
    });

    const [ano, mes, dia] = scheduleData.date.split('-');
    const dateStr = `${dia}/${mes}/${ano}`;
    const msg = `Olá! Gostaria de *AGENDAR VISITA*:\n🚗 ${selectedCar.brand} ${selectedCar.model}\n📅 ${dateStr} às ${scheduleData.time}`;
    window.open(`https://wa.me/557999999999?text=${encodeURIComponent(msg)}`, '_blank');
    closeInterestModal();
  };

  const calculateFinance = () => {
    if(!selectedCar) return 0;
    const price = selectedCar.price;
    const entry = Number(entryValue) || 0;
    const financedAmount = price - entry;
    const rate = 0.015;
    const total = financedAmount * (1 + rate * installments);
    return (total / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredCars = cars.filter(car => {
    if (car.status !== 'disponivel') return false;
    if (showOnlyFavs && !favorites.includes(car.id)) return false;
    const matchBrand = car.brand.toLowerCase().includes(searchBrand.toLowerCase());
    const matchModel = car.model.toLowerCase().includes(searchModel.toLowerCase());
    const matchPrice = !maxPrice || car.price <= Number(maxPrice);
    return matchBrand && matchModel && matchPrice;
  });

  return (
    <div>
      <header style={{ background: 'white', padding: '15px 0', borderBottom: '2px solid #d4af37', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* RESPONSIVIDADE: Header quebra linha suavemente */}
        <div className="container header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.1rem' }}>
            <Car color="#d4af37" /> MENDONÇA AUTO PRIME
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700' }}>Olá, {user?.name?.split(' ')[0]}</div>
            </div>
            <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={handleLogout}><LogOut size={16}/></button>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* RESPONSIVIDADE: Filtros empilham no mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input placeholder="Marca..." value={searchBrand} onChange={e => setSearchBrand(e.target.value)} style={{ margin: 0 }} />
            <input placeholder="Modelo..." value={searchModel} onChange={e => setSearchModel(e.target.value)} style={{ margin: 0 }} />
            <input type="number" placeholder="Preço Máx..." value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ margin: 0 }} />
          </div>
          <button className={`btn ${showOnlyFavs ? 'btn-danger' : 'btn-outline'}`} onClick={() => setShowOnlyFavs(!showOnlyFavs)} style={{ width: '100%' }}>
            <Heart size={18} fill={showOnlyFavs ? 'white' : 'none'}/> {showOnlyFavs ? 'Ver Todos' : 'Ver Apenas Favoritos'}
          </button>
        </div>

        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>{showOnlyFavs ? 'Meus Favoritos' : 'Veículos Disponíveis'}</h3>
        
        <div className="car-grid">
          {filteredCars.map(car => (
            <CarCard key={car.id} car={car} isManager={false} onInterest={handleInterestClick} />
          ))}
        </div>
      </div>

      {selectedCar && (
        <Modal title={`${selectedCar.brand} ${selectedCar.model}`} onClose={closeInterestModal}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginBottom: '10px', color: '#475569', display: 'flex', gap: '8px' }}><Calculator size={18}/> Simulação Estimada</h4>
                <div className="form-row">
                  <div className="form-group"><label>Entrada (R$)</label><input type="number" value={entryValue} onChange={e => setEntryValue(e.target.value)} /></div>
                  <div className="form-group"><label>Parcelas</label><select value={installments} onChange={e => setInstallments(Number(e.target.value))}><option value="12">12x</option><option value="24">24x</option><option value="36">36x</option><option value="48">48x</option><option value="60">60x</option></select></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#d4af37', marginTop: '5px' }}>{installments}x de {calculateFinance()}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="btn btn-outline" onClick={sendSimpleMessage}><MessageCircle size={18}/> WhatsApp</button>
                <div style={{ gridColumn: '1 / -1', height: '1px', background: '#e2e8f0', margin: '5px 0' }}></div>
              </div>

              <form onSubmit={sendScheduleMessage} style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                 <h4 style={{ marginBottom: '15px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18}/> Agendar Visita</h4>
                 <div className="form-group"><label>Data</label><input type="date" required min={new Date().toISOString().split('T')[0]} value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} /></div>
                 <div className="form-group"><label>Hora</label><input type="time" required value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} /></div>
                 <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirmar Agendamento</button>
              </form>
           </div>
        </Modal>
      )}
    </div>
  );
}