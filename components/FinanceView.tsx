
import React from 'react';
import { Order } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function FinanceView({ orders }: { orders: Order[] }) {
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total_paid || 0), 0);
  const totalReceivable = orders.reduce((acc, o) => acc + (o.price - o.total_paid), 0);
  const avgOrderValue = orders.length > 0 ? orders.reduce((acc, o) => acc + o.price, 0) / orders.length : 0;

  const chartData = React.useMemo(() => {
    const months: any = {};
    const now = new Date();
    // Générer les 6 derniers mois
    for(let i=5; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = { name: key, income: 0 };
    }
    // Remplir avec les données réelles
    orders.forEach(order => {
       if(!order.payments || !Array.isArray(order.payments)) return;
       order.payments.forEach(p => {
         const d = new Date(p.date);
         const key = d.toLocaleString('default', { month: 'short' });
         if(months[key]) { months[key].income += (p.amount || 0); }
       });
    });
    return Object.values(months);
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <h2 className="text-2xl font-bold text-slate-800">Analyse Financière</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-white/5 w-32 h-32 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center gap-3 mb-4 text-slate-300">
            <TrendingUp size={20} className="text-green-400" />
            <span className="text-sm font-medium uppercase tracking-wider">Recettes Totales</span>
          </div>
          <div className="text-4xl font-bold mb-1">{totalRevenue.toLocaleString()} <span className="text-xl text-slate-500">F</span></div>
          <div className="text-xs text-slate-400">Montant total encaissé</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <TrendingDown size={20} className="text-red-500" />
            <span className="text-sm font-medium uppercase tracking-wider">Reste à percevoir</span>
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{totalReceivable.toLocaleString()} <span className="text-xl text-slate-400">F</span></div>
          <div className="text-xs text-slate-400">Dettes clients en attente</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <Activity size={20} className="text-blue-500" />
            <span className="text-sm font-medium uppercase tracking-wider">Panier Moyen</span>
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{Math.round(avgOrderValue).toLocaleString()} <span className="text-xl text-slate-400">F</span></div>
          <div className="text-xs text-slate-400">Valeur moyenne par commande</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-6 text-slate-700">Flux de trésorerie (6 derniers mois)</h3>
        <div className="w-full h-[350px] min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{fill: '#64748b', fontSize: 10}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="income" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#db2777' : '#0f172a'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
