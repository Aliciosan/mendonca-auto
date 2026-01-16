import { useState } from 'react';
import { useAuto } from '../context/AutoContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, UserPlus, Lock } from 'lucide-react';
import Modal from '../components/Modal';

// Certifique-se que o nome do arquivo aqui está igual ao da sua pasta assets
import videoLogo from '../assets/logo-animada.mp4';

export default function Login() {
  const { login, clients, registerClient } = useAuto();
  const navigate = useNavigate();
  
  const [activeLogin, setActiveLogin] = useState(null); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', cpf: '', phone: '' });

  // --- LÓGICA DO GERENTE ---
  const handleManagerSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin') {
      login('gerente');
      navigate('/gerente');
    } else {
      alert("Senha incorreta! Tente: admin");
    }
  };

  // --- LÓGICA DO CLIENTE ---
  const checkEmail = (e) => {
    e.preventDefault();
    const found = clients.find(c => c.email === email);
    if (found) {
      login('cliente', found);
      navigate('/cliente');
    } else {
      setIsNewUser(true);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const newUser = { ...newUserData, email };
    registerClient(newUser);
    login('cliente', newUser);
    navigate('/cliente');
  };

  const closeModals = () => {
    setActiveLogin(null);
    setIsNewUser(false);
    setPassword('');
    setEmail('');
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      overflow: 'hidden', background: '#000000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      
      {/* Container do Vídeo */}
      <div style={{ 
        width: '100%', maxWidth: '500px', height: 'auto', maxHeight: '45%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px'
      }}>
         <video 
           src={videoLogo} 
           autoPlay 
           loop 
           muted 
           playsInline
           // A classe "logo-glow-effect" foi removida daqui
           style={{ 
             width: '100%', 
             height: '100%', 
             objectFit: 'contain',
             pointerEvents: 'none'
           }} 
         />
      </div>

      {/* Botões de Escolha */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <div onClick={() => setActiveLogin('gerente')} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', textAlign: 'center', width: '140px', transition: '0.3s' }}>
          <Shield size={32} color="#d4af37" style={{ marginBottom: '10px' }} />
          <h3>Gerente</h3>
        </div>

        <div onClick={() => setActiveLogin('cliente')} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', textAlign: 'center', width: '140px', transition: '0.3s' }}>
          <User size={32} color="#d4af37" style={{ marginBottom: '10px' }} />
          <h3>Cliente</h3>
        </div>
      </div>

      {/* --- MODAIS DE LOGIN --- */}
      {activeLogin === 'gerente' && (
        <Modal title="Acesso Administrativo" onClose={closeModals}>
          <form onSubmit={handleManagerSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
              <Lock size={40} color="#d4af37"/>
              <p>Área restrita para funcionários.</p>
            </div>
            <div className="form-group">
              <label>Senha de Acesso</label>
              <input type="password" required placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
            <div style={{marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center'}}>(Senha de teste: <strong>admin</strong>)</div>
          </form>
        </Modal>
      )}

      {activeLogin === 'cliente' && (
        <Modal title={isNewUser ? "Completar Cadastro" : "Acesso ao Catálogo"} onClose={closeModals}>
          {!isNewUser ? (
            <form onSubmit={checkEmail}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fcd34d', color: '#b45309', fontSize: '0.9rem' }}>
                <UserPlus size={16} style={{ display: 'inline', marginRight: '5px' }}/> Email novo! Complete seus dados:
              </div>
              <div className="form-group"><label>Nome Completo</label><input required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} /></div>
              <div className="form-group"><label>CPF</label><input required value={newUserData.cpf} onChange={e => setNewUserData({...newUserData, cpf: e.target.value})} /></div>
              <div className="form-group"><label>Telefone</label><input required value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} /></div>
              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>Cadastrar e Entrar</button>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
}