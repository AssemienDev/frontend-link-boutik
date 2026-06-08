// app/merchant/clients/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, MessageSquare, Phone, Calendar, ShoppingBag, FolderCheck } from "lucide-react";
import Link from "next/link";

interface CustomerDetail {
    id: string;
    full_name: string;
    phone_number: string;
    email: string | null;
    address: string | null;
    notes: string | null;
    total_orders_count: number;
    total_spent: number;
    last_order_date: string | null;
}

interface OrderHistoryItem {
    id: string;
    tracking_number: string;
    current_status: string;
    total_amount: number;
    created_at: string;
}

export default function CustomerDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            apiFetch<CustomerDetail>(`/merchant/customers/${id}`),
            apiFetch<OrderHistoryItem[]>(`/merchant/customers/${id}/orders`)
        ])
            .then(([custData, ordersData]) => {
                setCustomer(custData);
                setOrders(ordersData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 animate-pulse">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-xs font-semibold">Chargement de la fiche client...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center">
                <div>
                    <h2 className="text-xl font-black">Client introuvable</h2>
                    <Link href="/merchant/customers" className="text-xs text-primary font-bold hover:underline mt-4 inline-block">
                        ← Retourner au répertoire
                    </Link>
                </div>
            </div>
        );
    }

    const initials = customer.full_name.charAt(0).toUpperCase() + customer.full_name.split(" ")[1]?.charAt(0).toUpperCase() || "";

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-24">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto h-16 px-6 flex items-center justify-between">
                    <Link href="/merchant/customers" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft className="w-4 h-4" /> Répertoire Clients
                    </Link>
                    <span className="text-sm font-black text-slate-800">Fiche Client CRM</span>
                    <div className="w-16 h-10" />
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 mt-8 space-y-6">

                {/* CARTE PROFIL PRINCIPALE (IMAGE 2) */}
                <div className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-left">
            <span className="w-14 h-14 rounded-full bg-teal-50 text-primary font-black text-base flex items-center justify-center shrink-0 border border-teal-100">
              {initials}
            </span>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">{customer.full_name}</h2>
                            <p className="text-xs text-slate-400 mt-1 font-semibold">{customer.email || "Aucun e-mail renseigné"}</p>
                        </div>
                    </div>

                    {/* Raccourcis de communication instantanés (IMAGE 2) */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <a
                            href={`https://wa.me/${customer.phone_number}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#22C55E] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
                        >
                            <MessageSquare className="w-4 h-4" /> WhatsApp
                        </a>
                        <a
                            href={`tel:${customer.phone_number}`}
                            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Phone className="w-4 h-4" /> Appeler
                        </a>
                    </div>
                </div>

                {/* GRILLE COMPTEURS FIDÉLITÉ (IMAGE 2) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-white border border-slate-200/60 rounded-2xl text-left shadow-sm">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Dépensé</span>
                        <span className="text-lg font-black text-primary block mt-2">
              {customer.total_spent.toLocaleString()} CFA
            </span>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/60 rounded-2xl text-left shadow-sm">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Commandes</span>
                        <span className="text-lg font-black text-slate-800 block mt-2">
              {customer.total_orders_count}
            </span>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/60 rounded-2xl text-left shadow-sm">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Dernière Cmd</span>
                        <span className="text-sm font-black text-slate-800 block mt-2 leading-relaxed">
              {customer.last_order_date
                  ? `Le ${new Date(customer.last_order_date).toLocaleDateString("fr-FR")}`
                  : "Aucune"}
            </span>
                        {customer.last_order_date && (
                            <span className="text-[10px] font-bold text-emerald-600 block mt-1">✓ Livrée avec succès</span>
                        )}
                    </div>
                </div>

                {/* EN-BAS : HISTORIQUE D'ACHATS COMPLET (IMAGE 2) */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900">Historique des Commandes</h3>
                        <span className="p-1.5 rounded-lg bg-teal-50 text-primary"><ShoppingBag className="w-4 h-4" /></span>
                    </div>

                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((cmd) => {
                                const isDelivered = cmd.current_status === "DELIVERED";
                                const isCancelled = cmd.current_status === "CANCELLED";
                                return (
                                    <div key={cmd.id} className="p-4 border border-slate-100 bg-slate-50/20 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-4">
                      <span className="p-2.5 rounded-full bg-white border border-slate-200/40 text-slate-400 flex items-center justify-center shrink-0">
                        <FolderCheck className="w-4 h-4" />
                      </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-black text-slate-800">{cmd.tracking_number}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                        isDelivered ? "bg-emerald-50 text-emerald-700" : isCancelled ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                                                    }`}>
                            {isDelivered ? "LIVRÉ" : isCancelled ? "ANNULÉ" : "EN COURS"}
                          </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Le {new Date(cmd.created_at).toLocaleDateString("fr-FR")}</p>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-xs font-black text-slate-800">{cmd.total_amount.toLocaleString()} CFA</p>
                                            <button
                                                onClick={() => router.push(`/commandes/details/${cmd.id}`)}
                                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Voir détails
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="text-center pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => router.push(`/commandes`)}
                                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                >
                                    Voir toutes les commandes ({orders.length})
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 text-xs py-8">Aucun achat enregistré pour ce client.</p>
                    )}
                </div>

            </main>

        </div>
    );
}