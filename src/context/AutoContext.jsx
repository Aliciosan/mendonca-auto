import { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';

const AutoContext = createContext();
const appChannel = new BroadcastChannel('mendonca_channel');

export const AutoProvider = ({ children }) => {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]); // NOVA LISTA
  const [user, setUser] = useState(null);

  // 1. Carregar dados
  useEffect(() => {
    const stored = localStorage.getItem('mendoncaAutoDB');
    if (stored) {
      const data = JSON.parse(stored);
      setCars(data.cars || []);
      setClients(data.clients || []);
      setSales(data.sales || []);
      setAppointments(data.appointments || []);
      setFavorites(data.favorites || []);
      setNotifications(data.notifications || []); // Carrega notificações
    }
    
    appChannel.onmessage = (event) => {
      if (event.data.type === 'UPDATE_DB') {
        const updatedStored = localStorage.getItem('mendoncaAutoDB');
        if (updatedStored) {
          const newData = JSON.parse(updatedStored);
          setCars(newData.cars || []);
          setClients(newData.clients || []);
          setSales(newData.sales || []);
          setAppointments(newData.appointments || []);
          setFavorites(newData.favorites || []);
          setNotifications(newData.notifications || []);
        }
      }
    };
  }, []);

  // 2. Salvar dados
  useEffect(() => {
    localStorage.setItem('mendoncaAutoDB', JSON.stringify({ cars, clients, sales, appointments, favorites, notifications }));
  }, [cars, clients, sales, appointments, favorites, notifications]);

  const notifyChanges = (actionType) => {
    appChannel.postMessage({ type: 'UPDATE_DB', action: actionType });
  };

  // --- Funções de Notificação ---
  const addSysNotification = (text, type = 'info') => {
    const newNotif = { id: Date.now(), text, type, read: false, date: new Date().toLocaleString() };
    const updatedNotifs = [newNotif, ...notifications]; // Adiciona no começo
    setNotifications(updatedNotifs);
    return updatedNotifs; // Retorna para uso imediato se precisar
  };

  const clearNotifications = () => {
    setNotifications([]);
    notifyChanges('clear_notifs');
  };

  const markNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    notifyChanges('read_notifs');
  };

  // --- Carros ---
  const addCar = (car) => {
    setCars([...cars, { ...car, id: Date.now(), status: 'disponivel' }]);
    toast.success('Veículo adicionado!');
    notifyChanges('car_add');
  };

  const updateCar = (updatedCar) => {
    setCars(cars.map(c => c.id === updatedCar.id ? updatedCar : c));
    toast.success('Veículo atualizado.');
    notifyChanges('car_update');
  };

  const deleteCar = (id) => {
    if(window.confirm("Excluir este veículo?")) {
      setCars(cars.filter(c => c.id !== id));
      toast.error('Veículo removido.');
      notifyChanges('car_delete');
    }
  };

  const markSold = (id) => {
    const car = cars.find(c => c.id === id);
    if (car) {
      const sale = {
        id: Date.now(),
        carModel: `${car.brand} ${car.model}`,
        price: car.price,
        clientName: 'Venda Direta (Loja)',
        date: new Date().toLocaleDateString('pt-BR')
      };
      setCars(cars.map(c => c.id === id ? { ...c, status: 'vendido' } : c));
      setSales([...sales, sale]);
      addSysNotification(`Veículo Vendido: ${car.brand} ${car.model}`, 'success');
      toast.success('Vendido!');
      notifyChanges('sale');
    }
  };

  // --- Clientes / Favoritos ---
  const toggleFavorite = (carId) => {
    if (favorites.includes(carId)) {
      setFavorites(favorites.filter(id => id !== carId));
      toast('Removido dos favoritos');
    } else {
      setFavorites([...favorites, carId]);
      toast.success('Adicionado aos favoritos!');
    }
  };

  const registerClient = (client) => {
    setClients([...clients, client]);
    toast.success('Cliente cadastrado!');
    addSysNotification(`Novo Cliente: ${client.name}`, 'info');
    notifyChanges('client_add');
  };

  const deleteClient = (index) => {
    if(window.confirm("Remover cliente?")) {
      const newClients = [...clients];
      newClients.splice(index, 1);
      setClients(newClients);
      notifyChanges('client_delete');
    }
  };

  // --- Agendamentos ---
  const addAppointment = (appt) => {
    // 1. Salva na Agenda
    setAppointments([...appointments, appt]);
    
    // 2. Gera Notificação no Painel
    const notifText = `Novo Agendamento: ${appt.clientName} - ${appt.carBrand} ${appt.carModel}`;
    const updatedList = [ { id: Date.now() + 1, text: notifText, type: 'alert', read: false, date: new Date().toLocaleString() }, ...notifications ];
    setNotifications(updatedList); // Atualiza localmente para salvar no LS

    toast.success('Agendamento Enviado!');
    
    // 3. Avisa via Canal (Som)
    appChannel.postMessage({ type: 'NEW_APPOINTMENT_ALERT', data: appt });
    notifyChanges('appointment_add');
  };

  const deleteAppointment = (id) => {
    if(window.confirm("Cancelar visita?")) {
      setAppointments(appointments.filter(a => a.id !== id));
      toast.info('Agendamento cancelado.');
      notifyChanges('appointment_delete');
    }
  };

  // --- Auth ---
  const login = (role, clientData = null) => {
    if (role === 'gerente') setUser({ role: 'gerente', name: 'Gerente' });
    else setUser({ role: 'cliente', ...clientData });
  };

  const logout = () => setUser(null);

  const resetAll = () => {
    if(window.confirm("Isso apagará TUDO. Continuar?")) {
      localStorage.removeItem('mendoncaAutoDB');
      window.location.reload();
    }
  };

  return (
    <AutoContext.Provider value={{ 
      cars, clients, sales, appointments, favorites, notifications, user, 
      login, logout, resetAll,
      addCar, updateCar, deleteCar, markSold, 
      registerClient, deleteClient,
      addAppointment, deleteAppointment, toggleFavorite,
      clearNotifications, markNotificationsAsRead
    }}>
      {children}
    </AutoContext.Provider>
  );
};

export const useAuto = () => useContext(AutoContext);