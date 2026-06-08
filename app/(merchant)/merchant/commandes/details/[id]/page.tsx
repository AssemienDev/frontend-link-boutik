// app/merchant/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Check, X, Phone, MapPin, CreditCard, RefreshCw, Printer, AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface OrderItem {
    id: string;
    product_name: string;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    selected_attributes: Record<string, string> | null;
}

interface OrderDetail {
    id: string;
    tracking_number: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    delivery_notes: string | null;
    source: string;
    current_status: string;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    amount_paid_online: number;
    amount_due_on_delivery: number;
    created_at: string;
    items: OrderItem[];
}

export default function OrderDetailPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // États de modales
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
    const [isPremiumOpen, setIsPremiumOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        apiFetch<OrderDetail>(`/merchant/orders/${id}`)
            .then((data) => {
                setOrder(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    // Action : Mettre à jour le statut de livraison
    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);

        try {
            const updatedOrder = await apiFetch<OrderDetail>(`/merchant/orders/${order.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: newStatus,
                    notify_whatsapp: notifyWhatsapp
                })
            });
            setOrder(updatedOrder);
            setIsStatusModalOpen(false);
        } catch (err: any) {
            if (err.status === 402) {
                setIsPremiumOpen(true); // Bloquer par le paywall premium
            } else {
                alert(err.message || "Échec de mise à jour du statut.");
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleWhatsappToggle = (checked: boolean) => {
        // Si on essaie d'activer mais qu'on n'est pas premium (simulation locale ou d'API)
        setNotifyWhatsapp(checked);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center animate-pulse">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-xs font-semibold">Chargement de la commande...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center">
                <div>
                    <h2 className="text-xl font-black">Commande introuvable</h2>
                    <Link href="/merchant/orders" className="text-xs text-primary font-bold hover:underline mt-4 inline-block">
                        ← Retourner à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const isCOD = order.payment_method === "CASH_ON_DELIVERY";
    const isCancelled = order.current_status === "CANCELLED";
    const isDelivered = order.current_status === "DELIVERED";

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-24">
            {/* HEADER COULISSANT */}
            <div className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto h-16 px-6 flex items-center justify-between">
                    <Link href="/merchant/orders" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
                    </Link>
                    <div className="text-center">
                        <span className="text-sm font-black text-slate-800 block">{order.tracking_number}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="w-16 h-10" />
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 mt-8 space-y-6">

                {/* BANDEAU DES STATUTS ACTUELS (IMAGE 1) */}
                <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-between shadow-sm text-xs font-bold">
          <span className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              order.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}>
            <Check className="w-4 h-4" /> {order.payment_status === "PAID" ? "Payé" : "Non payé"}
          </span>
                    <span className="text-slate-500 flex items-center gap-1.5">
            🚚 {order.current_status === "DELIVERED" ? "Livré" : order.current_status === "CANCELLED" ? "Annulé" : "En cours de livraison"}
          </span>
                </div>

                {/* FICHE CLIENT DU CRM */}
                <div className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">{order.customer_name}</h3>
                        <span className="w-10 h-10 rounded-full bg-teal-50 text-primary font-black text-xs flex items-center justify-center">
              {order.customer_name.charAt(0).toUpperCase()}
            </span>
                    </div>
                    <div className="space-y-3 text-xs text-slate-600 font-semibold">
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{order.customer_phone}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{order.delivery_address || "Aucune adresse enregistrée"}</span>
                        </div>
                    </div>
                </div>

                {/* LISTE DES ARTICLES DE FACTURE (IMAGE 1) */}
                <div className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm space-y-6">
                    <h3 className="text-base font-black text-slate-900">Articles ({order.items.length})</h3>

                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0 border border-slate-100 bg-slate-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.product_image_url || "/placeholder-product.png"} alt={item.product_name} className="absolute inset-0 w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800">{item.product_name}</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                            {item.selected_attributes ? Object.entries(item.selected_attributes).map(([k, v]) => `${k}: ${v}`).join(", ") : "Taille Unique"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-800">{item.unit_price.toLocaleString()} CFA</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">x{item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MÉTHODE DE PAIEMENT */}
                <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Moyen de paiement</span>
                    <span className="text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-400" /> {order.payment_method === "CASH_ON_DELIVERY" ? "Paiement à la livraison" : "Mobile Money"}
          </span>
                </div>

                {/* TOTALS COMPTABLES */}
                <div className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm space-y-3.5 text-xs text-slate-500 font-semibold">
                    <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span className="text-slate-800">{order.total_amount.toLocaleString()} CFA</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span>Frais de livraison</span>
                        <span className="text-slate-800">Gratuit (Hors plateforme)</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-sm font-black text-slate-800">Total</span>
                        <span className="text-2xl font-black text-primary">{order.total_amount.toLocaleString()} CFA</span>
                    </div>
                </div>

                {/* BOUTONS D'ACTIONS DE BAS DE FACTURE */}
                <div className="space-y-3">
                    <button
                        onClick={() => setIsStatusModalOpen(true)}
                        className="w-full py-4 rounded-xl bg-primary text-white font-extrabold text-xs md:text-sm hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-primary/10"
                    >
                        <RefreshCw className="w-4 h-4" /> Mettre à jour le statut
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs md:text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Printer className="w-4 h-4 text-slate-400" /> Imprimer la facture
                    </button>
                </div>

            </main>

            {/* ========================================================= */}
            {/* MODALE : HISTORIQUE LOGISTIQUE & STATUT (IMAGE 2) */}
            {/* ========================================================= */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full text-left space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">

                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Mise à jour logistique</span>
                            <h3 className="text-sm font-black text-slate-900">{order.tracking_number}</h3>
                        </div>

                        {/* LA FRISE CHRONOLOGIQUE DE LIVRAISON (IMAGE 2) */}
                        <div className="space-y-6 relative pl-8 border-l border-slate-200/80 ml-4 py-2">

                            {/* ÉTAPE 1 : Confirmation (COD spécifique / Écran 2) */}
                            <div className="relative">
                <span className={`absolute -left-12 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${
                    order.current_status !== "PENDING" ? "bg-emerald-500" : "bg-slate-200"
                }`}>
                  ✓
                </span>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xs md:text-sm">Commande Confirmée</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Vérification de commande marchand</p>

                                    {/* Si COD et en attente, le premier niveau affiche le choix de validation demandé */}
                                    {isCOD && order.current_status === "PENDING" && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleUpdateStatus("CONFIRMED")}
                                                className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-extrabold text-[10px]"
                                            >
                                                Confirmer commande
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus("CANCELLED")}
                                                className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-[10px]"
                                            >
                                                Annuler la vente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ÉTAPE 2 : Préparation */}
                            <div className="relative">
                <span className={`absolute -left-12 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${
                    order.current_status === "PREPARING" || order.current_status === "SHIPPED" || isDelivered ? "bg-emerald-500" : "bg-slate-200"
                }`}>
                  📦
                </span>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xs md:text-sm">Préparation en cours</h4>
                                    {order.current_status === "CONFIRMED" && (
                                        <button
                                            onClick={() => handleUpdateStatus("PREPARING")}
                                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px]"
                                        >
                                            Marquer comme prêt
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ÉTAPE 3 : Remis au transporteur */}
                            <div className="relative">
                <span className={`absolute -left-12 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${
                    order.current_status === "SHIPPED" || isDelivered ? "bg-emerald-500" : "bg-slate-200"
                }`}>
                  🚚
                </span>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xs md:text-sm">Remis au transporteur</h4>
                                    {order.current_status === "PREPARING" && (
                                        <button
                                            onClick={() => handleUpdateStatus("SHIPPED")}
                                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px]"
                                        >
                                            Remettre au livreur
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ÉTAPE 4 : Livré */}
                            <div className="relative">
                <span className={`absolute -left-12 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${
                    isDelivered ? "bg-emerald-500" : "bg-slate-200"
                }`}>
                  🏠
                </span>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xs md:text-sm">Livré</h4>
                                    {order.current_status === "SHIPPED" && (
                                        <button
                                            onClick={() => handleUpdateStatus("DELIVERED")}
                                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#22C55E] text-white font-extrabold text-[10px]"
                                        >
                                            Confirmer la livraison
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* TOGGLE NOTIFIER PAR WHATSAPP (SÉCURISÉ PREMIUM ONLY) */}
                        <div className="flex items-center justify-between p-3.5 border border-slate-200/60 bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-2">💬 Notifier le client par WhatsApp</span>
                            <input
                                type="checkbox"
                                checked={notifyWhatsapp}
                                onChange={(e) => handleWhatsappToggle(e.target.checked)}
                                className="toggle toggle-primary toggle-sm cursor-pointer"
                            />
                        </div>

                        {/* BOUTON FERMER MODALE */}
                        <button
                            onClick={() => setIsStatusModalOpen(false)}
                            className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs text-center cursor-pointer"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODALE : SÉCURITÉ PAYWALL PREMIUM SUR NOTIFICATION WHATSAPP */}
            {/* ========================================================= */}
            {isPremiumOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center mx-auto border border-amber-100">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Fonctionnalité Premium</h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                L&#39;envoi automatique de notifications de livraison au client via WhatsApp est réservé exclusivement aux abonnés des forfaits **Business** et **Pro**.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsPremiumOpen(false)} className="w-1/2 py-3 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs">Fermer</button>
                            <button
                                type="button"
                                onClick={() => router.push("/settings/billing")}
                                className="w-1/2 py-3 rounded-xl bg-[#F59E0B] text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                            >
                                <ShieldAlert className="w-4 h-4" /> S&#39;abonner
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}