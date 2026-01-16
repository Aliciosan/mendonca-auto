import { Car, Check, Trash, Edit, Calendar, Gauge, Palette, Heart } from 'lucide-react';
import { motion } from 'framer-motion'; // Animação
import { useAuto } from '../context/AutoContext'; // Para acessar favoritos

export default function CarCard({ car, isManager, onEdit, onDelete, onSell, onInterest }) {
  const { favorites, toggleFavorite } = useAuto(); // Puxa função de favoritos
  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const isFav = favorites.includes(car.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} // Começa invisível e um pouco abaixo
      animate={{ opacity: 1, y: 0 }}  // Aparece e sobe
      transition={{ duration: 0.4 }}  // Duração da animação
      className="car-card"
      style={{ position: 'relative' }}
    >
      <div className="car-img-container">
        {car.image ? (
          <img src={car.image} alt={car.model} />
        ) : (
          <div style={{ fontSize: '3rem', color: '#cbd5e1' }}><Car size={64} /></div>
        )}
        
        {/* Badge de Status */}
        <span className={`badge ${car.status === 'disponivel' ? 'badge-avail' : 'badge-sold'}`}>
          {car.status === 'disponivel' ? 'Disponível' : 'Vendido'}
        </span>

        {/* Botão de Favoritar (Só para clientes e se disponivel) */}
        {!isManager && car.status === 'disponivel' && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(car.id); }}
            style={{
              position: 'absolute', top: 10, left: 10,
              background: 'white', border: 'none', borderRadius: '50%',
              width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              transition: '0.2s'
            }}
          >
            <Heart size={20} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#94a3b8'} />
          </button>
        )}
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '5px' }}>{car.brand} {car.model}</div>
        <div style={{ fontSize: '1.4rem', color: '#b4941f', fontWeight: '800', marginBottom: '15px' }}>
          {formatMoney(car.price)}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '6px' }}><Calendar size={14}/> {car.year}</div>
          <div style={{ display: 'flex', gap: '6px' }}><Gauge size={14}/> {car.km}km</div>
          <div style={{ display: 'flex', gap: '6px' }}><Palette size={14}/> {car.color}</div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          {isManager ? (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => onEdit(car)}>
                  <Edit size={16} /> Editar
                </button>
                <button className="btn btn-danger" onClick={() => onDelete(car.id)}>
                  <Trash size={16} />
                </button>
              </div>
              {car.status === 'disponivel' && (
                <button className="btn btn-success" style={{ width: '100%' }} onClick={() => onSell(car.id)}>
                  <Check size={16} /> Marcar Vendido
                </button>
              )}
            </>
          ) : (
             car.status === 'disponivel' && (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onInterest(car)}>
                Tenho Interesse
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}