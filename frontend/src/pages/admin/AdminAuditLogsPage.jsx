import { useState, useEffect, useCallback } from "react";
import { getAdminAuditLogs } from "../../services/adminService.js";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  SearchInput,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
} from "../../components/ui/index.js";
import {
  ShieldCheckIcon,
  RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ClockIcon,
} from "../../components/ui/Icons.jsx";

function formatTimestamp(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  const [availableActions, setAvailableActions] = useState([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminAuditLogs({
          search: activeSearch,
          action: selectedAction,
          entityType: selectedEntityType,
          severity: selectedSeverity,
          page: pageToLoad,
          limit: 20,
        });

        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setPagination({
          page: data?.pagination?.page || pageToLoad,
          limit: data?.pagination?.limit || 20,
          total: data?.pagination?.total || 0,
          pages: data?.pagination?.pages || 1,
        });

        if (Array.isArray(data?.filters?.availableActions)) {
          setAvailableActions(data.filters.availableActions);
        }
        if (Array.isArray(data?.filters?.availableEntityTypes)) {
          setAvailableEntityTypes(data.filters.availableEntityTypes);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
        setError("Unable to load security audit trail. Please verify administrator permissions.");
      } finally {
        setLoading(false);
      }
    },
    [activeSearch, selectedAction, selectedEntityType, selectedSeverity]
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger">Critical</Badge>;
      case "warning":
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Security & Audit Trail"
        description="Immutable administrative and security event logs for compliance and accountability."
        breadcrumbs={[{ label: "Admin Console" }, { label: "Audit Logs" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            iconLeft={<RefreshIcon className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Filter Bar ── */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder="Search actions, IPs..."
            />

            <Select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </Select>

            <Select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
            >
              <option value="all">All Entity Types</option>
              {availableEntityTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </Select>

            <Select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Log Content ── */}
      {error ? (
        <ErrorState
          title="Error Loading Audit Trail"
          message={error}
          onRetry={() => fetchLogs(1)}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Audit Records ({pagination.total.toLocaleString()})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chronological ledger of security and moderation operations.
              </CardDescription>
            </div>
          </CardHeader>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow hoverable={false}>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead align="right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const actorName = log.user
                        ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email
                        : "System";

                      return (
                        <TableRow key={log._id}>
                          <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-slate-900 font-mono">
                            {log.action}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-[11px] text-slate-400 block font-mono">
                                ID: {log.entityId.slice(-6)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            <div>
                              <span className="font-medium text-slate-900">{actorName}</span>
                              {log.user?.role && (
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                  {log.user.role}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {log.ipAddress || "—"}
                          </TableCell>
                          <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                            >
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination ── */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                  <div>
                    Page <span className="font-semibold text-slate-800">{pagination.page}</span> of{" "}
                    <span className="font-semibold text-slate-800">{pagination.pages}</span> (
                    {pagination.total} total events)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchLogs(pagination.page - 1)}
                      iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchLogs(pagination.page + 1)}
                      iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={ShieldCheckIcon}
              title="No Audit Records Found"
              description="No audit events matched your active filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm("");
                setSelectedAction("all");
                setSelectedEntityType("all");
                setSelectedSeverity("all");
              }}
            />
          )}
        </Card>
      )}

      {/* ── Event Inspection Modal ── */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Event ID
                </span>
                <span className="font-mono text-slate-700 select-all">{selectedLog._id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Timestamp
                </span>
                <span className="text-slate-700">{formatTimestamp(selectedLog.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Actor
                </span>
                <span className="text-slate-800 font-medium">
                  {selectedLog.user
                    ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})`
                    : "System / Anonymous"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  IP / User Agent
                </span>
                <span className="font-mono text-slate-700 block truncate" title={selectedLog.userAgent}>
                  {selectedLog.ipAddress} • {selectedLog.userAgent || "unknown"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider block mb-1">
                Event Metadata (Sanitized)
              </span>
              <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-64">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
