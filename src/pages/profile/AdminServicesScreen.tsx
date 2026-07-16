import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Power,
  Key,
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Trash2,
  Terminal,
  Clock,
  Heart,
  Plus,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "../../hooks/useGoBack";

interface KeyStatus {
  status: 'active' | 'cooldown' | 'disabled';
  errorCount: number;
  lastUsed?: number;
  keyMasked: string;
}

interface LastHealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  latency: number;
}

interface ApiService {
  id: string;
  name: string;
  enabled: boolean;
  keys: KeyStatus[];
  currentKeyIndex: number;
  errors: number;
  calls: number;
  lastHealthCheck?: LastHealthCheck;
}

interface ApiLog {
  timestamp: string;
  serviceId: string;
  status: 'success' | 'error';
  latency?: number;
  message?: string;
}

interface SelfHealingLog {
  timestamp: string;
  action: string;
  status: 'triggered' | 'recovered' | 'healthy';
  details: string;
}

export const AdminServicesScreen = () => {
  const goBack = useGoBack();
  const [services, setServices] = useState<ApiService[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [selfHealingLogs, setSelfHealingLogs] = useState<SelfHealingLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingServiceId, setTestingServiceId] = useState<string | null>(null);
  const [editingKeysServiceId, setEditingKeysServiceId] = useState<string | null>(null);
  const [newKeysText, setNewKeysText] = useState<string>("");

  const fetchServiceData = async () => {
    try {
      const response = await fetch("/api/admin/services");
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
        setApiLogs(data.logs || []);
        setSelfHealingLogs(data.selfHealingLogs || []);
      }
    } catch (error) {
      console.error("Error fetching admin service data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
    const interval = setInterval(fetchServiceData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleToggleService = async (serviceId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch("/api/admin/services/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, enabled: !currentEnabled })
      });
      const data = await response.json();
      if (data.success) {
        fetchServiceData();
      }
    } catch (error) {
      console.error("Failed to toggle service:", error);
    }
  };

  const handleRotateKey = async (serviceId: string) => {
    try {
      const response = await fetch("/api/admin/services/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId })
      });
      const data = await response.json();
      if (data.success) {
        fetchServiceData();
      } else {
        alert(data.error || "Rotation failed");
      }
    } catch (error) {
      console.error("Failed to rotate key:", error);
    }
  };

  const handleTestConnection = async (serviceId: string) => {
    setTestingServiceId(serviceId);
    try {
      const response = await fetch("/api/admin/services/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Test connection success for ${data.service}! Status: ${data.status.toUpperCase()}, Latency: ${data.latency}ms`);
      } else {
        alert(`Test connection failed: ${data.error || "Unknown Error"}`);
      }
      fetchServiceData();
    } catch (error: any) {
      alert(`Test connection failed: ${error?.message || error}`);
    } finally {
      setTestingServiceId(null);
    }
  };

  const handleUpdateKeys = async (serviceId: string) => {
    const keysArray = newKeysText.split("\n").map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      alert("Please provide at least one key.");
      return;
    }
    try {
      const response = await fetch("/api/admin/services/update-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, keys: keysArray })
      });
      const data = await response.json();
      if (data.success) {
        alert("Keys updated successfully!");
        setEditingKeysServiceId(null);
        setNewKeysText("");
        fetchServiceData();
      } else {
        alert(data.error || "Failed to update keys.");
      }
    } catch (error) {
      console.error("Failed to update keys:", error);
    }
  };

  const handleTriggerHealing = async (action: 'flush_cache' | 'reset_cooldowns') => {
    try {
      const response = await fetch("/api/admin/self-healing/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchServiceData();
      } else {
        alert(data.error || "Trigger failed");
      }
    } catch (error) {
      console.error("Failed to trigger healing:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="text-amber-500 animate-spin-slow" size={20} />
              Enterprise API Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hari Pathshala Self-Healing Control Panel</p>
          </div>
        </div>
        <button
          onClick={fetchServiceData}
          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 transition"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Analyzing service ecosystem health...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          
          {/* Healing Hub (Quick Actions Card) */}
          <section className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <Activity size={320} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 animate-pulse" />
                <h2 className="text-xl font-bold">Auto-Healing & Infrastructure Engine</h2>
              </div>
              <p className="text-sm text-white/90 max-w-2xl leading-relaxed">
                Hari Pathshala runs isolated background microservices. If an API key encounters quota errors, Google GenAI blocks, or rate limits, the self-healing system automatically marks the key for a 5-minute cooldown and rotates to alternative working credentials with zero application crash.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => handleTriggerHealing("reset_cooldowns")}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  Reset Key Cooldowns & Recalibrate
                </button>
                <button
                  onClick={() => handleTriggerHealing("flush_cache")}
                  className="bg-white hover:bg-slate-100 text-orange-600 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  <Trash2 size={14} />
                  Flush Document Cache Memory
                </button>
              </div>
            </div>
          </section>

          {/* Grid of Microservices */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Microservice Control Hub ({services.length} Isolated Services)
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {services.map((service) => {
                const totalKeys = service.keys.length;
                const activeKeys = service.keys.filter(k => k.status === 'active').length;
                const cooldownKeys = service.keys.filter(k => k.status === 'cooldown').length;
                
                return (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between transition hover:shadow-md"
                  >
                    {/* Top Row: Service details */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 dark:text-white text-base">
                            {service.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {service.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Total Requests: <span className="font-bold text-slate-700 dark:text-slate-300">{service.calls}</span> | Failures: <span className="font-bold text-red-500">{service.errors}</span>
                        </p>
                      </div>
                      
                      {/* Toggle button */}
                      <button
                        onClick={() => handleToggleService(service.id, service.enabled)}
                        className={`p-2.5 rounded-xl transition-all ${
                          service.enabled
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                            : "bg-rose-50 dark:bg-rose-950/30 text-rose-500"
                        }`}
                        title={service.enabled ? "Disable Service" : "Enable Service"}
                      >
                        <Power size={16} />
                      </button>
                    </div>

                    {/* Status details & health checks */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Status</span>
                        <span className={`font-bold flex items-center gap-1 ${service.enabled ? "text-emerald-500" : "text-rose-500"}`}>
                          {service.enabled ? (
                            <>
                              <CheckCircle size={12} /> Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} /> Offline
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Key Status</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {activeKeys}/{totalKeys} Active
                          {cooldownKeys > 0 && (
                            <span className="text-amber-500 ml-1">({cooldownKeys} cd)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Health Ping</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                          {service.lastHealthCheck ? (
                            <span className={service.lastHealthCheck.status === 'healthy' ? "text-emerald-500" : "text-rose-500"}>
                              {service.lastHealthCheck.latency}ms
                            </span>
                          ) : (
                            "No Ping"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Keys list */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Key size={12} /> Rotating Keys Array
                        </span>
                        {totalKeys > 1 && (
                          <button
                            onClick={() => handleRotateKey(service.id)}
                            className="text-[10px] text-amber-600 font-bold hover:underline"
                          >
                            Force Rotate
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {service.keys.map((k, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                              idx === service.currentKeyIndex && service.enabled
                                ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-950/30"
                                : "bg-transparent border-slate-100 dark:border-slate-800"
                            }`}
                          >
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {k.keyMasked} {idx === service.currentKeyIndex && service.enabled && "👉"}
                            </span>
                            <div className="flex items-center gap-2">
                              {k.status === 'cooldown' ? (
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Cooldown
                                </span>
                              ) : k.status === 'disabled' ? (
                                <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Blocked
                                </span>
                              ) : (
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Active
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">Errors: {k.errorCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setEditingKeysServiceId(service.id);
                          setNewKeysText("");
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Plus size={12} /> Replace Keys
                      </button>
                      <button
                        onClick={() => handleTestConnection(service.id)}
                        disabled={testingServiceId === service.id}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Heart size={12} className={testingServiceId === service.id ? "animate-pulse" : ""} />
                        {testingServiceId === service.id ? "Testing..." : "Test Connection"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Real-time Diagnostics Log & Self Healing Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Realtime API Logs */}
            <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Terminal className="text-amber-500" size={16} /> Real-time Request Stream
              </h3>
              <div className="space-y-2 h-80 overflow-y-auto pr-1">
                {apiLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12">No requests logged yet. Invoke features to watch execution stream.</p>
                ) : (
                  apiLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/20 text-xs leading-relaxed">
                      {log.status === 'success' ? (
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {log.serviceId.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.message && <p className="text-slate-500 dark:text-slate-400 mt-0.5 break-all">{log.message}</p>}
                        {log.latency && <span className="text-[10px] text-emerald-600 font-bold">Latency: {log.latency}ms</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Self-Healing Events logs */}
            <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="text-orange-500" size={16} /> Self-Healing Core Events
              </h3>
              <div className="space-y-2 h-80 overflow-y-auto pr-1">
                {selfHealingLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12">System ecosystem is currently optimal and stable.</p>
                ) : (
                  selfHealingLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-orange-50/30 dark:bg-amber-950/5 text-xs leading-relaxed">
                      <Clock size={14} className="text-amber-500 shrink-0 mt-0.5 animate-spin-slow" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold inline-block mt-1">
                          Status: {log.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

          {/* Key Overwrite Modal Dialog */}
          {editingKeysServiceId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="text-amber-500" size={18} />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Replace Keys: {editingKeysServiceId}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide one or more API Keys (one per line). These keys will override the current key rotation list immediately, without requiring an application build or restart.
                </p>
                <textarea
                  rows={4}
                  value={newKeysText}
                  onChange={(e) => setNewKeysText(e.target.value)}
                  placeholder="Paste your API keys here, one key per line..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingKeysServiceId(null)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateKeys(editingKeysServiceId)}
                    className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-xl text-xs font-bold transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
};
