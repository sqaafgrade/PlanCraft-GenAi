// ============================================================
// src/components/Ideas/PersonalizedIdeas.tsx
// Personalized AI event ideas: Themes, Decor, Entertainment, Catering,
// Budget-Friendly tips, Sustainable options, and Accessibility concepts.
// ============================================================

import { memo, useState } from 'react';
import { EventItem, EventIdea, IdeaCategory } from '@/types';
import { loadEventIdeas, saveEventIdeas } from '@/services/storageService';

interface PersonalizedIdeasProps {
  event: EventItem | null;
}

const DEFAULT_IDEAS: EventIdea[] = [
  {
    id: 'idea-1',
    category: IdeaCategory.Theme,
    title: 'Botanical Garden & Champagne Glow',
    description: 'Earthy eucalyptus runners, warm amber string lights, and brushed brass candleholders for an ethereal romantic atmosphere.',
    tags: ['Aesthetics', 'Romantic', 'Lighting'],
    whyRecommended: 'Complements your venue preference while maintaining high aesthetic elegance without exorbitant floral costs.',
  },
  {
    id: 'idea-2',
    category: IdeaCategory.BudgetFriendly,
    title: 'Signature Drinks Over Full Open Bar',
    description: 'Offer two handcrafted signature cocktails/mocktails alongside beer & wine rather than a top-shelf unlimited liquor bar.',
    estimatedSavings: 1800,
    tags: ['Catering', 'Smart Savings'],
    whyRecommended: 'Keeps bar service flowing fast while reducing overall beverage spending by up to 25%.',
  },
  {
    id: 'idea-3',
    category: IdeaCategory.Sustainable,
    title: 'Zero-Waste Catering & Seed-Paper Favors',
    description: 'Partner with local farms for seasonal menus, donate untouched prepared food to community food rescue, and hand out plantable seed-paper favors.',
    tags: ['Eco', 'Zero-Waste', 'Local'],
    whyRecommended: 'Aligns with modern environmental standards and provides guests with an interactive plant-growing memory.',
  },
  {
    id: 'idea-4',
    category: IdeaCategory.Accessibility,
    title: 'Sensory-Friendly Quiet Lounge & Tactile Wayfinding',
    description: 'Provide a designated quiet retreat space with soft lighting and comfortable seating away from the main speakers, plus clear visual wayfinding with high-contrast signage.',
    tags: ['Inclusion', 'Quiet Space', 'WCAG AA'],
    whyRecommended: 'Ensures elderly guests, neurodiverse attendees, and children have a safe, soothing space during high-energy moments.',
  },
  {
    id: 'idea-5',
    category: IdeaCategory.Entertainment,
    title: 'Interactive Audio Guestbook & Live Painter',
    description: 'Place a vintage rotary phone where guests record heartfelt voicemail memories, accompanied by a live painter capturing the reception.',
    tags: ['Activities', 'Memories', 'Interactive'],
    whyRecommended: 'Creates tangible emotional artifacts that last long after the celebration concludes.',
  },
  {
    id: 'idea-6',
    category: IdeaCategory.Decor,
    title: 'Repurposed Ceremony Arch to Head Table Backdrop',
    description: 'Design the floral ceremony arch with modular transport handles so event staff can transition it behind the head table during cocktail hour.',
    estimatedSavings: 600,
    tags: ['Florals', 'Multi-Use'],
    whyRecommended: 'Doubles the visual exposure of your primary floral centerpiece without purchasing a second backdrop.',
  },
];

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Ideas', icon: '✨' },
  { id: IdeaCategory.Theme, label: 'Themes & Styling', icon: '🎨' },
  { id: IdeaCategory.Decor, label: 'Decor Concepts', icon: '💐' },
  { id: IdeaCategory.Entertainment, label: 'Activities & Music', icon: '🎵' },
  { id: IdeaCategory.Catering, label: 'Food & Menu', icon: '🍽️' },
  { id: IdeaCategory.BudgetFriendly, label: 'Smart Budget Tips', icon: '💡' },
  { id: IdeaCategory.Sustainable, label: 'Eco & Sustainable', icon: '🌱' },
  { id: IdeaCategory.Accessibility, label: 'Accessibility & Care', icon: '♿' },
];

export const PersonalizedIdeas = memo(function PersonalizedIdeas({ event }: PersonalizedIdeasProps) {
  const [ideas, setIdeas] = useState<EventIdea[]>(() => {
    if (!event) return DEFAULT_IDEAS;
    const loaded = loadEventIdeas(event.id);
    return loaded && loaded.length > 0 ? loaded : DEFAULT_IDEAS;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Form for custom idea
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<IdeaCategory>(IdeaCategory.Theme);
  const [whyRecommended, setWhyRecommended] = useState('');
  const [estimatedSavings, setEstimatedSavings] = useState<number>(0);

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !event) return;

    const newIdea: EventIdea = {
      id: `idea-${Date.now()}`,
      category,
      title: title.trim(),
      description: desc.trim() || 'Personalized concept',
      tags: [category.charAt(0).toUpperCase() + category.slice(1)],
      whyRecommended: whyRecommended.trim() || 'Custom recommendation tailored to event scope.',
      estimatedSavings: estimatedSavings > 0 ? estimatedSavings : undefined,
    };

    const updated = [newIdea, ...ideas];
    setIdeas(updated);
    saveEventIdeas(event.id, updated);

    setTitle('');
    setDesc('');
    setWhyRecommended('');
    setEstimatedSavings(0);
  };

  const handleDeleteIdea = (id: string) => {
    if (!event) return;
    const updated = ideas.filter((i) => i.id !== id);
    setIdeas(updated);
    saveEventIdeas(event.id, updated);
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (activeCategory === 'all') return true;
    return idea.category === activeCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <section
        aria-labelledby="ideas-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 backdrop-blur shadow-xl"
      >
        <h2 id="ideas-heading" className="text-xl font-black text-white flex items-center gap-2">
          <span>💡</span> Personalized Event Ideas & Inspiration
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Curated suggestions for themes, guest entertainment, smart cost savings, eco-friendly choices, and accessibility.
        </p>
      </section>

      {/* ── Category Filter Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Idea Categories">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Add Custom Idea Form ── */}
      <form
        onSubmit={handleAddIdea}
        aria-label="Add Personalized Idea"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3 shadow-xl"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          + Add Custom Event Idea
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="idea-cat" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Category
            </label>
            <select
              id="idea-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as IdeaCategory)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value={IdeaCategory.Theme}>Theme & Styling</option>
              <option value={IdeaCategory.Decor}>Decor Concepts</option>
              <option value={IdeaCategory.Entertainment}>Entertainment</option>
              <option value={IdeaCategory.Catering}>Catering & Menu</option>
              <option value={IdeaCategory.BudgetFriendly}>Budget-Friendly Tip</option>
              <option value={IdeaCategory.Sustainable}>Sustainable / Eco</option>
              <option value={IdeaCategory.Accessibility}>Accessibility Care</option>
            </select>
          </div>

          <div>
            <label htmlFor="idea-title" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Title *
            </label>
            <input
              id="idea-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Polaroid Photo Wall & Guestbook"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="idea-savings" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Estimated Savings (Optional $)
            </label>
            <input
              id="idea-savings"
              type="number"
              min="0"
              value={estimatedSavings}
              onChange={(e) => setEstimatedSavings(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="idea-desc" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Concept Description
            </label>
            <input
              id="idea-desc"
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="How the idea is executed"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="idea-why" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Why it Fits Your Event
            </label>
            <input
              id="idea-why"
              type="text"
              value={whyRecommended}
              onChange={(e) => setWhyRecommended(e.target.value)}
              placeholder="Rationale / guest impact"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Add Idea
          </button>
        </div>
      </form>

      {/* ── Idea Cards Grid ── */}
      <section aria-label="Personalized Ideas List" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg text-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {idea.category.replace('_', ' ')}
                </span>
                {idea.estimatedSavings && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saves ~${idea.estimatedSavings.toLocaleString()}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-white text-sm mt-3">{idea.title}</h4>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">{idea.description}</p>

              {/* Rationale box */}
              <div className="mt-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-indigo-300 block mb-0.5">Why this fits:</strong>
                {idea.whyRecommended}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {idea.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                aria-label={`Remove idea ${idea.title}`}
                onClick={() => handleDeleteIdea(idea.id)}
                className="text-slate-400 hover:text-rose-400 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
});
