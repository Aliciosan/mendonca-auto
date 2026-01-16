import { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase'; // Importa a conexão

const AutoContext = createContext();
const appChannel = new BroadcastChannel('mendonca_channel');

export const AutoProvider = ({ children }) => {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [user, setUser] = useState(null);

  // 1. CARREGAR DADOS DO SUPABASE
  const fetchData = async () => {
    const { data: carsData } = await supabase.from('cars').select('*').order('id', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('*');
    const { data: salesData } = await supabase.from('sales').select('*');
    const { data: apptData } = await supabase.from('appointments').select('*');

    if (carsData) setCars(carsData);
    if (clientsData) setClients(clientsData);
    if (salesData) setSales(salesData);
    if (apptData) setAppointments(apptData);
  };

  useEffect(() => {
    fetchData();

    // Sincronização em tempo real simples
    appChannel.onmessage = (event) => {
      if (event.data.type === 'UPDATE_DB') fetchData();
    };
  }, []);

  const notifyChanges = () => {
    appChannel.postMessage({ type: 'UPDATE_DB' });
  };

  // --- CARROS ---
  const addCar = async (car) => {
    // Remove o ID temporário para o banco gerar um
    const { id, ...newCar } = car; 
    const { error } = await supabase.from('cars').insert([newCar]);
    
    if (error) {
      toast.error('Erro ao salvar.');
      console.error(error);
    } else {
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
      // 1. Atualiza status
      await supabase.from('cars').update({ status: 'vendido' }).eq('id', id);
      
      // 2. Cria venda
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

  // --- CLIENTES ---
  const registerClient = async (client) => {
    await supabase.from('clients').insert([client]);
    toast.success('Cliente Cadastrado');
    fetchData();
  };

  const deleteClient = async (id) => {
    if(confirm("Remover?")) {
      await supabase.from('clients').delete().eq('id', id);
      fetchData();
    }
  };

  // --- AGENDAMENTOS ---
  const addAppointment = async (appt) => {
    // Ajusta nomes das colunas para o banco (snake_case)
    const dbAppt = {
      client_name: appt.clientName,
      client_phone: appt.clientPhone,
      car_brand: appt.carBrand,
      car_model: appt.carModel,
      date: appt.date,
      time: appt.time
    };

    await supabase.from('appointments').insert([dbAppt]);
    
    toast.success('Agendamento Confirmado!');
    fetchData();
    
    // Avisa Gerente (Som)
    appChannel.postMessage({ type: 'NEW_APPOINTMENT_ALERT', data: appt });
    notifyChanges();
  };

  const deleteAppointment = async (id) => {
    if(confirm("Cancelar visita?")) {
      await supabase.from('appointments').delete().eq('id', id);
      fetchData();
      notifyChanges();
    }
  };

  // --- Auth (Local) ---
  const login = (role, data) => setUser(role === 'gerente' ? { role: 'gerente', name: 'Gerente' } : { role: 'cliente', ...data });
  const logout = () => setUser(null);
  const resetAll = async () => { 
    if(confirm("ATENÇÃO: Isso limpará o BANCO DE DADOS INTEIRO no servidor. Confirmar?")) {
       // Cuidado: isso apaga dados reais do Supabase
       await supabase.from('cars').delete().neq('id', 0);
       await supabase.from('clients').delete().neq('id', 0);
       await supabase.from('sales').delete().neq('id', 0);
       await supabase.from('appointments').delete().neq('id', 0);
       location.reload();
    }
  };

  return (
    <AutoContext.Provider value={{ 
      cars, clients, sales, appointments, user, 
      login, logout, resetAll, addCar, updateCar, deleteCar, markSold, registerClient, deleteClient,
      addAppointment, deleteAppointment 
    }}>
      {children}
    </AutoContext.Provider>
  );
};

export const useAuto = () => useContext(AutoContext);