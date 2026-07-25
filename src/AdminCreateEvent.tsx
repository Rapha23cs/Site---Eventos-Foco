import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, PlusCircle, Trash2, Users, Briefcase, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { ImageUploadWithCrop } from './components/ImageUploadWithCrop';

interface AdminCreateEventProps {
  eventId?: string | number | null; // Se passado, é modo Edição
  onBack: () => void;
}

export function AdminCreateEvent({ eventId, onBack }: AdminCreateEventProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!eventId);
  const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error', message: string}>({show: false, type: 'success', message: ''});
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Curso',
    date: '',
    time: '',
    location: '',
    price: '',
    capacity: '',
    description: '',
    image_url: ''
  });

  const [sponsors, setSponsors] = useState<{name: string, imageUrl: string, category: string}[]>([]);
  const [speakers, setSpeakers] = useState<{name: string, role: string, imageUrl: string}[]>([]);
  const [schedule, setSchedule] = useState<{time: string, title: string, description: string}[]>([]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  async function fetchEventData() {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
    if (data) {
      setFormData({
        name: data.name || '',
        type: data.type || 'Curso',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        price: data.price ? data.price.toString() : '',
        capacity: data.capacity ? data.capacity.toString() : '',
        description: data.description || '',
        image_url: data.image_url || ''
      });
      
      try {
        if (data.sponsors) {
          const parsed = JSON.parse(data.sponsors);
          if (Array.isArray(parsed)) setSponsors(parsed);
        }
      } catch(e) {}
      
      try {
        if (data.speakers) {
          const parsed = JSON.parse(data.speakers);
          if (Array.isArray(parsed)) setSpeakers(parsed);
        }
      } catch(e) {}

      try {
        if ((data as any).schedule) {
          const parsed = JSON.parse((data as any).schedule);
          if (Array.isArray(parsed)) setSchedule(parsed);
        }
      } catch(e) {}
    } else {
      // Se for novo evento, pré-preenche a Realização
      setSponsors([{ name: 'Foco Consultancy Group', imageUrl: '/logo1.png', category: 'Realização' }]);
    }
    setFetching(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showNotification('error', 'O nome do evento é obrigatório.');
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name,
      type: formData.type,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      price: formData.price ? parseFloat(formData.price) : 0,
      capacity: formData.capacity,
      description: formData.description,
      image_url: formData.image_url,
      sponsors: sponsors.length > 0 ? JSON.stringify(sponsors) : null,
      speakers: speakers.length > 0 ? JSON.stringify(speakers) : null,
      schedule: schedule.length > 0 ? JSON.stringify(schedule) : null,
    };

    try {
      if (eventId) {
        // Atualizar
        const { error } = await supabase.from('events').update(payload).eq('id', eventId);
        if (error) throw error;
        showNotification('success', 'Evento atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase.from('events').insert([payload]);
        if (error) throw error;
        showNotification('success', 'Evento criado com sucesso!');
      }
      setTimeout(() => onBack(), 1500);
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Erro ao salvar o evento: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: '', role: '', imageUrl: '' }]);
  };

  const updateSpeaker = (index: number, field: string, value: string) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setSpeakers(newSpeakers);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { name: '', imageUrl: '', category: 'Patrocinador' }]);
  };

  const updateSponsor = (index: number, field: string, value: string) => {
    const newSponsors = [...sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    setSponsors(newSponsors);
  };

  const removeSponsor = (index: number) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const addScheduleItem = () => {
    setSchedule([...schedule, { time: '', title: '', description: '' }]);
  };

  const updateScheduleItem = (index: number, field: string, value: string) => {
    const newSchedule = [...schedule];
    let formattedValue = value;
    
    // Auto-formatação de hora (HH:MM)
    if (field === 'time') {
      let v = value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0, 4);
      if (v.length > 2) v = `${v.slice(0, 2)}:${v.slice(2)}`;
      formattedValue = v;
    }
    
    newSchedule[index] = { ...newSchedule[index], [field]: formattedValue };
    setSchedule(newSchedule);
  };

  const removeScheduleItem = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303392]" />
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 flex-1 relative">
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-red-600" />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-[#303392] hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {eventId ? 'Editar Evento' : 'Criar Novo Evento'}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 p-8 max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Nome do Evento *</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
                placeholder="Ex: Workshop de Tecnologia"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Tipo de Evento</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
              >
                <option value="Curso">Curso</option>
                <option value="Fórum">Fórum</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Data</label>
              <input 
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
                placeholder="Ex: 15/10/2026"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Horário</label>
              <input 
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
                placeholder="Ex: 14:00 às 18:00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Preço (R$)</label>
              <input 
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
                placeholder="Deixe em branco para gratuito"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Capacidade</label>
              <input 
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
                placeholder="Ex: 200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Localização</label>
            <input 
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium"
              placeholder="Ex: Centro de Convenções"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-400" /> Imagem de Capa do Evento
            </label>
            <ImageUploadWithCrop 
              onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              aspect={16/9}
              label="Upload da Capa (16:9)"
              currentImageUrl={formData.image_url}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Descrição</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none font-medium resize-none"
              placeholder="Descreva os detalhes do evento..."
            ></textarea>
          </div>

          {/* PROGRAMAÇÃO SECTION */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#303392]" /> Programação
                </h3>
                <button 
                  type="button" 
                  onClick={addScheduleItem}
                  className="flex items-center gap-1 text-sm font-bold text-[#303392] hover:text-[#1E205A] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Adicionar Item
                </button>
              </div>
            
            {schedule.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum item na programação.</p>
            ) : (
              <div className="space-y-4">
                {schedule.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 relative group">
                    <button 
                      type="button" 
                      onClick={() => removeScheduleItem(idx)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-32 space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Horário</label>
                      <input 
                        type="text"
                        value={item.time}
                        onChange={(e) => updateScheduleItem(idx, 'time', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        placeholder="Ex: 10:00"
                      />
                    </div>
                    
                    <div className="flex-[2] space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Atividade</label>
                      <input 
                        type="text"
                        value={item.title}
                        onChange={(e) => updateScheduleItem(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        placeholder="Ex: Palestra Magna"
                      />
                    </div>
                    
                    <div className="flex-[3] space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Descrição (Opcional)</label>
                      <input 
                        type="text"
                        value={item.description}
                        onChange={(e) => updateScheduleItem(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        placeholder="Ex: Apresentação sobre futuro do mercado"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PALESTRANTES SECTION (Always visible, for both Curso and Fórum) */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#303392]" /> Palestrantes
                </h3>
                <button 
                  type="button" 
                  onClick={addSpeaker}
                  className="flex items-center gap-1 text-sm font-bold text-[#303392] hover:text-[#1E205A] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Adicionar Palestrante
                </button>
              </div>
            
            {speakers.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum palestrante adicionado.</p>
            ) : (
              <div className="space-y-4">
                {speakers.map((speaker, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 relative group">
                    <button 
                      type="button" 
                      onClick={() => removeSpeaker(idx)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Nome</label>
                      <input 
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        placeholder="Nome do palestrante"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Cargo / Papel</label>
                      <input 
                        type="text"
                        value={speaker.role}
                        onChange={(e) => updateSpeaker(idx, 'role', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        placeholder="Ex: Especialista em IA"
                      />
                    </div>
                    
                    <div className="flex-[2] space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Foto</label>
                      <ImageUploadWithCrop 
                        onUploadSuccess={(url) => updateSpeaker(idx, 'imageUrl', url)}
                        aspect={1}
                        label="Upload da Foto (1:1)"
                        currentImageUrl={speaker.imageUrl}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PATROCINADORES / REALIZAÇÃO SECTION */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#303392]" /> Parcerias & Realização
              </h3>
              <button 
                type="button" 
                onClick={addSponsor}
                className="flex items-center gap-1 text-sm font-bold text-[#E31E24] hover:text-[#B31217] transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Adicionar
              </button>
            </div>
            
            {sponsors.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum adicionado.</p>
            ) : (
                <div className="space-y-4">
                  {sponsors.map((sponsor, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 relative group">
                      <button 
                        type="button" 
                        onClick={() => removeSponsor(idx)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex-[2] space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Nome / Empresa</label>
                        <input 
                          type="text"
                          value={sponsor.name}
                          onChange={(e) => updateSponsor(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                          placeholder="Nome do patrocinador"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Categoria</label>
                        <select 
                          value={sponsor.category || 'Patrocinador'}
                          onChange={(e) => updateSponsor(idx, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-lg outline-none text-sm font-medium"
                        >
                          <option value="Patrocinador">Patrocinador</option>
                          <option value="Apoiador">Apoiador</option>
                          <option value="Realização">Realização</option>
                        </select>
                      </div>
                      
                      <div className="flex-[2] space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Logo</label>
                        <ImageUploadWithCrop 
                          onUploadSuccess={(url) => updateSponsor(idx, 'imageUrl', url)}
                          aspect={16/9}
                          label="Upload do Logo"
                          currentImageUrl={sponsor.imageUrl}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#303392] text-white font-bold rounded-xl shadow-sm hover:bg-[#1E205A] transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {eventId ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
