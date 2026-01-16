import { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase';

const AutoContext = createContext();
const appChannel = new BroadcastChannel('mendonca_channel');

export const AutoProvider = ({ children }) => {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]); // Inicia vazio para não dar erro
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  // 1. CARREGAR DADOS (Supabase + LocalStorage para Notificações)
  const fetchData = async () => {
    // Busca dados do Supabase
    const { data: carsData } = await supabase.from('cars').select('*').order('id', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('*');
    const { data: salesData } = await supabase.from('sales').select('*');
    const { data: apptData } = await supabase.from('appointments').select('*');

    if (carsData) setCars(carsData);
    if (clientsData) setClients(clientsData);
    if (salesData) setSales(salesData);
    if (apptData) setAppointments(apptData);

    // Busca notificações locais (LocalStorage)
    const localNotifs = localStorage.getItem('mendonca_notifs');
    if (localNotifs) {
      setNotifications(JSON.parse(localNotifs));
    }
  };

  useEffect(() => {
    fetchData();

    // Escuta mudanças de outras abas
    appChannel.onmessage = (event) => {
      if (event.data.type === 'UPDATE_DB') fetchData();
    };
  }, []);

  // Salva notificações no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('mendonca_notifs', JSON.stringify(notifications));
  }, [notifications]);

  const notifyChanges = (actionType) => {
    appChannel.postMessage({ type: 'UPDATE_DB', action: actionType });
  };

  // --- SISTEMA DE NOTIFICAÇÕES (O Sininho) ---
  const addSysNotification = (text, type = 'info') => {
    const newNotif = { id: Date.now(), text, type, read: false, date: new Date().toLocaleString() };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => setNotifications([]);
  
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- CARROS (Supabase) ---
  const addCar = async (car) => {
    const { id, ...newCar } = car; 
    const { error } = await supabase.from('cars').insert([newCar]);
    if (!error) {
      toast.success('Veículo adicionado!');
      fetchData();
      notifyChanges();
    }
  };

  const updateCar = async (car) => {
    const { error } = await supabase.from('cars').update(car).eq('id', car.id);
    if (!error) {
      toast.success('Atualizado!');
      fetchData();
      notifyChanges();
    }
  };

  const deleteCar = async (id) => {
    if(confirm("Excluir?")) {
      await supabase.from('cars').delete().eq('id', id);
      fetchData();
      notifyChanges();
    }
  };

  const markSold = async (id) => {
    const car = cars.find(c => c.id === id);
    if (car) {
      await supabase.from('cars').update({ status: 'vendido' }).eq('id', id);
      await supabase.from('sales').insert([{
        car_model: `${car.brand} ${car.model}`,
        price: car.price,
        client_name: 'Loja',
        date: new Date().toLocaleDateString('pt-BR')
      }]);
      toast.success('Vendido!');
      fetchData();
      notifyChanges();
    }
  };

  // --- AGENDAMENTOS (A Mágica do Som) ---
  const addAppointment = async (appt) => {
    // 1. Salva no Supabase
    const dbAppt = {
      client_name: appt.clientName,
      client_phone: appt.clientPhone,
      car_brand: appt.carBrand,
      car_model: appt.carModel,
      date: appt.date,
      time: appt.time
    };
    await supabase.from('appointments').insert([dbAppt]);
    
    // 2. Avisa o Gerente (Som e Notificação)
    appChannel.postMessage({ type: 'NEW_APPOINTMENT_ALERT', data: appt });
    
    // 3. Adiciona notificação local
    addSysNotification(`Novo Agendamento: ${appt.clientName}`, 'alert');
    
    toast.success('Agendamento Confirmado!');
    fetchData();
    notifyChanges();
  };

  const deleteAppointment = async (id) => {
    if(confirm("Cancelar visita?")) {
      await supabase.from('appointments').delete().eq('id', id);
      fetchData();
      notifyChanges();
    }
  };

  // --- Clientes / Favoritos / Auth ---
  const registerClient = async (c) => { await supabase.from('clients').insert([c]); toast.success('Cadastrado'); fetchData(); };
  const deleteClient = async (id) => { if(confirm("Remover?")) { await supabase.from('clients').delete().eq('id', id); fetchData(); }};
  
  const toggleFavorite = (id) => {
    // Favoritos mantemos local pois é por dispositivo
    if (favorites.includes(id)) setFavorites(favorites.filter(fid => fid !== id));
    else setFavorites([...favorites, id]);
  };

  const login = (role, data) => setUser(role === 'gerente' ? { role: 'gerente', name: 'Gerente' } : { role: 'cliente', ...data });
  const logout = () => setUser(null);
  const resetAll = async () => { if(confirm("CUIDADO: Isso apaga o banco online. Confirmar?")) { 
    // Limpeza radical (opcional)
    await supabase.from('cars').delete().neq('id', 0);
    await supabase.from('appointments').delete().neq('id', 0);
    location.reload(); 
  }};

  return (
    <AutoContext.Provider value={{ 
      cars, clients, sales, appointments, favorites, notifications, user, 
      login, logout, resetAll, addCar, updateCar, deleteCar, markSold, registerClient, deleteClient,
      addAppointment, deleteAppointment, toggleFavorite, clearNotifications, markNotificationsAsRead
    }}>
      {children}
    </AutoContext.Provider>
  );
};

export const useAuto = () => useContext(AutoContext);