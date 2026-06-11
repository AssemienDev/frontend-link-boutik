// app/merchant/support/page.tsx
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useMerchantAuthStore } from "@/store/merchantAuthStore";
import { ArrowRight, HelpCircle, Plus, FileQuestion, LifeBuoy, AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react";

interface Ticket {
    id: string;
    subject: string;
    description: string;
    status: string; // OPEN | IN_PROGRESS | RESOLVED
    priority: string; // LOW | MEDIUM | HIGH
    created_at: string;
}

export default function MerchantSupportPage() {
    const { merchant } = useMerchantAuthStore();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // États de modale de création
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Formulaire d'envoi
    const [form, setForm] = useState({ subject: "", description: "", priority: "MEDIUM" });

    // Accordéon : ID du ticket déroulé
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<Ticket[]>("/merchant/support/tickets");
            setTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const newTicket = await apiFetch<Ticket>("/merchant/support/tickets", {
                method: "POST",
                body: JSON.stringify(form)
            });

            setTickets([newTicket, ...tickets]);
            setIsAddOpen(false);
            setForm({ subject: "", description: "", priority: "MEDIUM" });
        } catch (err: any) {
            setError(err.message || "Échec d'envoi de votre demande d'assistance.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === "RESOLVED") return "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-100";
        return "bg-amber-50 text-amber-700 border-amber-100"; // OPEN
    };

    const getStatusLabel = (status: string) => {
        if (status === "RESOLVED") return "Résolu";
        if (status === "IN_PROGRESS") return "En cours";
        return "Ouvert";
    };

    const getPriorityStyle = (priority: string) => {
        if (priority === "HIGH") return "text-rose-600";
        if (priority === "MEDIUM") return "text-amber-600";
        return "text-slate-400";
    };

    const getPriorityLabel = (priority: string) => {
        if (priority === "HIGH") return "Urgence Haute";
        if (priority === "MEDIUM") return "Priorité Moyenne";
        return "Priorité Basse";
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto relative">

            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Client</h1>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Gérez vos demandes d'aide et suivez l'assistance de la plateforme.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="px-5 py-3 rounded-xl bg-primary text-white font-extrabold text-xs hover:opacity-95 transition flex items-center justify-center gap-2 shadow-md shadow-teal-900/10 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Nouveau Ticket
                </button>
            </div>

            {/* RANGÉE DE COMPTEURS DE SUPPORT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* COMPTEUR 1 : OPEN TICKETS */}
                <div className="p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-left flex justify-between items-center h-24">
                    <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Tickets Ouverts</span>
                        <span className="text-xl font-black text-slate-800 block mt-1.5">
              {tickets.filter(t => t.status !== "RESOLVED").length}
            </span>
                    </div>
                    <span className="p-2.5 rounded-xl bg-amber-50 text-secondary"><AlertCircle className="w-5 h-5" /></span>
                </div>

                {/* COMPTEUR 2 : RESOLVED TICKETS */}
                <div className="p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-left flex justify-between items-center h-24">
                    <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Demandes Résolues</span>
                        <span className="text-xl font-black text-slate-800 block mt-1.5">
              {tickets.filter(t => t.status === "RESOLVED").length}
            </span>
                    </div>
                    <span className="p-2.5 rounded-xl bg-emerald-50 text-tertiary"><CheckCircle2 className="w-5 h-5" /></span>
                </div>

                {/* COMPTEUR 3 : MOYENNE REPONSE */}
                <div className="p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-left flex justify-between items-center h-24">
                    <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Délai moyen de réponse</span>
                        <span className="text-sm font-black text-primary block mt-2.5 leading-relaxed">&lt; 2 Heures</span>
                    </div>
                    <span className="p-2.5 rounded-xl bg-teal-50 text-primary"><LifeBuoy className="w-5 h-5" /></span>
                </div>

            </div>

            {/* LISTE DES TICKETS ACTIFS */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4">Vos Demandes d'Assistance</h3>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 border rounded-2xl" />)}
                    </div>
                ) : tickets.length > 0 ? (
                    <div className="space-y-3">
                        {tickets.map((ticket) => {
                            const isExpanded = expandedTicketId === ticket.id;
                            return (
                                <div
                                    key={ticket.id}
                                    className="border border-slate-200/60 bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
                                >
                                    {/* Titre cliquable de l'accordéon */}
                                    <button
                                        type="button"
                                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                        className="w-full p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                                    >
                                        <div className="text-left space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusStyle(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                                                <span className={`text-[9px] font-bold ${getPriorityStyle(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                                            </div>
                                            <h4 className="text-xs md:text-sm font-black text-slate-800 leading-snug">{ticket.subject}</h4>
                                            <p className="text-[10px] text-slate-400 font-semibold">Le {new Date(ticket.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "transform rotate-180 text-primary" : ""}`} />
                                    </button>

                                    {/* Zone de contenu déroulante */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-2 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 leading-relaxed space-y-4">
                                            <div className="space-y-1.5">
                                                <p className="font-bold text-slate-700">Votre message :</p>
                                                <p className="p-3 bg-white border border-slate-150 rounded-xl leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">Un agent de support étudie votre demande. Nous vous notifierons sur WhatsApp dès qu'une réponse est apportée.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium text-sm">Vous n'avez soumis aucun ticket d'aide.</p>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MODALE : CRÉER UN TICKET DE SUPPORT */}
            {/* ========================================================= */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-sm w-full text-left space-y-5 shadow-2xl">

                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                            <LifeBuoy className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-black text-slate-900">Nouveau Ticket d'Assistance</h3>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Sujet de la demande *</label>
                                <input
                                    type="text" required value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    placeholder="Ex: Erreur d'upload d'image R2..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Urgence / Priorité</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700"
                                >
                                    <option value="LOW">Basse (Simple question)</option>
                                    <option value="MEDIUM">Moyenne (Bug de configuration)</option>
                                    <option value="HIGH">Haute (Blocage bloquant de boutique)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Description détaillée *</label>
                                <textarea
                                    required rows={5} value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Veuillez décrire le problème rencontré précisément..."
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="w-1/2 py-3 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs">Annuler</button>
                                <button type="submit" disabled={submitting} className="w-1/2 py-3 rounded-xl bg-primary text-white font-extrabold text-xs flex items-center justify-center cursor-pointer">
                                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Envoyer"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}