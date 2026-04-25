'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AccountCreateDialog } from './account-create-dialog';
import { TradeForm } from './trade-form';
import { PositionsTable } from './positions-table';
import { HoldingsPieChart } from './holdings-pie-chart';
import type {
  PortfolioAccount,
  PortfolioTrade,
  PortfolioCashEntry,
  PortfolioSnapshot,
} from '@/types/portfolio';

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    HKD: 'HK$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-semibold tracking-tight">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={`size-9 rounded-lg flex items-center justify-center ${iconColor || 'bg-muted'}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Cash Ledger Sub-tab
function CashLedgerTab({ accounts }: { accounts: PortfolioAccount[] }) {
  const [entries, setEntries] = useState<PortfolioCashEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accountId: accounts[0]?.id || '',
    eventDate: new Date().toISOString().slice(0, 10),
    direction: 'in' as 'in' | 'out',
    amount: '',
    note: '',
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/cash');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const res = await fetch('/api/portfolio/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }
      toast.success('资金记录已添加');
      setForm({ ...form, amount: '', note: '' });
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const totalBalance = entries.reduce((sum, e) => {
    return e.direction === 'in' ? sum + e.amount : sum - e.amount;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Add Cash Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">新增资金记录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">账户</Label>
              <Select
                value={form.accountId}
                onValueChange={(v) => setForm({ ...form, accountId: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">方向</Label>
              <Select
                value={form.direction}
                onValueChange={(v) => setForm({ ...form, direction: v as 'in' | 'out' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <span className="text-emerald-600 dark:text-emerald-400">存入</span>
                  </SelectItem>
                  <SelectItem value="out">
                    <span className="text-red-600 dark:text-red-400">取出</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">金额</Label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">日期</Label>
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="h-8">
              <Plus className="size-3 mr-1" /> 记录
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <div className="flex items-center gap-2 px-1">
        <Wallet className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          资金余额:
        </span>
        <span className={`text-sm font-semibold ${totalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatCurrency(Math.abs(totalBalance), 'CNY')}
        </span>
      </div>

      {/* Cash Ledger Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">日期</TableHead>
              <TableHead className="text-xs font-semibold">账户</TableHead>
              <TableHead className="text-xs font-semibold">方向</TableHead>
              <TableHead className="text-xs font-semibold text-right">金额</TableHead>
              <TableHead className="text-xs font-semibold">备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="size-4 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  暂无资金记录
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs">
                    {new Date(entry.eventDate).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-xs">{entry.accountName}</TableCell>
                  <TableCell>
                    {entry.direction === 'in' ? (
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 gap-1">
                        <ArrowDownCircle className="size-3" /> 存入
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 gap-1">
                        <ArrowUpCircle className="size-3" /> 取出
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm font-medium ${entry.direction === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {entry.direction === 'in' ? '+' : '-'}{formatCurrency(entry.amount, entry.currency || 'CNY')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {entry.note || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Trades History Sub-tab
function TradesHistoryTab({ accounts }: { accounts: PortfolioAccount[] }) {
  const [trades, setTrades] = useState<PortfolioTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSymbol) params.set('symbol', filterSymbol);
      if (filterAccount) params.set('accountId', filterAccount);
      const res = await fetch(`/api/portfolio/trades?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterSymbol, filterAccount]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleDelete = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/portfolio/trades/${tradeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      toast.success('交易记录已删除');
      fetchTrades();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索代码..."
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value.toUpperCase())}
            className="h-8 w-36 text-sm"
          />
        </div>
        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="全部账户" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部账户</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchTrades} className="h-8">
          <RefreshCw className="size-3 mr-1" /> 刷新
        </Button>
      </div>

      {/* Trades Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">日期</TableHead>
                <TableHead className="text-xs font-semibold">账户</TableHead>
                <TableHead className="text-xs font-semibold">代码</TableHead>
                <TableHead className="text-xs font-semibold">方向</TableHead>
                <TableHead className="text-xs font-semibold text-right">数量</TableHead>
                <TableHead className="text-xs font-semibold text-right">价格</TableHead>
                <TableHead className="text-xs font-semibold text-right">金额</TableHead>
                <TableHead className="text-xs font-semibold">备注</TableHead>
                <TableHead className="text-xs font-semibold w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="size-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                    暂无交易记录
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TableRow key={trade.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs">
                      {new Date(trade.tradeDate).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {trade.accountName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {trade.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trade.side === 'buy' ? (
                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                          买入
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
                          卖出
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {trade.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {trade.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {(trade.quantity * trade.price).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {trade.note || '-'}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除这笔 {trade.side === 'buy' ? '买入' : '卖出'} {trade.symbol} × {trade.quantity} 的交易记录吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(trade.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Corporate Actions placeholder
function CorporateActionsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Briefcase className="size-10 mb-3 opacity-30" />
      <p className="text-sm font-medium">公司行动管理</p>
      <p className="text-xs mt-1">分红、拆股等公司行动记录（开发中）</p>
    </div>
  );
}

// Main Portfolio View
export function PortfolioView() {
  const [accounts, setAccounts] = useState<PortfolioAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [costMethod, setCostMethod] = useState<'FIFO' | 'AVG'>('FIFO');
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/portfolio/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch snapshot
  const fetchSnapshot = useCallback(async () => {
    setLoadingSnapshot(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccountId !== 'all') params.set('accountId', selectedAccountId);
      params.set('costMethod', costMethod);
      const res = await fetch(`/api/portfolio/snapshot?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSnapshot(false);
    }
  }, [selectedAccountId, costMethod]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const handleTradeSubmitted = () => {
    fetchSnapshot();
  };

  const handleAccountCreated = () => {
    fetchAccounts();
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolio/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      const data = await res.json();
      toast.success(`账户已删除（删除 ${data.deletedTrades} 条交易，${data.deletedCashEntries} 条资金记录）`);
      if (selectedAccountId === id) {
        setSelectedAccountId('all');
      }
      fetchAccounts();
      fetchSnapshot();
    } catch {
      toast.error('删除失败');
    }
  };

  const totalPnl = snapshot ? snapshot.totalMarketValue - snapshot.positions.reduce((s, p) => s + p.quantity * p.avgCost, 0) : 0;
  const totalPnlPct = snapshot && snapshot.positions.length > 0
    ? (totalPnl / snapshot.positions.reduce((s, p) => s + p.quantity * p.avgCost, 0)) * 100
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="size-5" />
            持仓管理
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            管理投资组合、追踪持仓盈亏
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AccountCreateDialog onCreated={handleAccountCreated} />
          {accounts.length > 0 && (
            <TradeForm accounts={accounts} onSubmitted={handleTradeSubmitted} />
          )}
        </div>
      </div>

      {/* Account Selector & Cost Method */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="选择账户" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">全部账户</span>
            </SelectItem>
            {accounts.map((acct) => (
              <SelectItem key={acct.id} value={acct.id} className="group">
                <div className="flex items-center justify-between w-full gap-4">
                  <span>{acct.name}</span>
                  <span className="text-xs text-muted-foreground">{acct.baseCurrency}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={costMethod} onValueChange={(v) => setCostMethod(v as 'FIFO' | 'AVG')}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIFO">FIFO</SelectItem>
            <SelectItem value="AVG">平均成本</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetchSnapshot} disabled={loadingSnapshot}>
          <RefreshCw className={`size-3.5 mr-1 ${loadingSnapshot ? 'animate-spin' : ''}`} />
          刷新
        </Button>

        {/* Delete account */}
        {selectedAccountId !== 'all' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 gap-1.5">
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">删除账户</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除账户</AlertDialogTitle>
                <AlertDialogDescription>
                  删除账户将同时删除该账户下所有交易记录和资金记录，此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteAccount(selectedAccountId)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Summary Cards */}
      {loadingSnapshot ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : snapshot ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="总资产"
            value={formatCurrency(snapshot.totalEquity, snapshot.currency)}
            subtext={`${snapshot.accountCount} 个账户`}
            icon={Briefcase}
            iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <SummaryCard
            title="总市值"
            value={formatCurrency(snapshot.totalMarketValue, snapshot.currency)}
            subtext={`${snapshot.positions.length} 只持仓`}
            icon={TrendingUp}
            iconColor="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
          />
          <SummaryCard
            title="总现金"
            value={formatCurrency(snapshot.totalCash, snapshot.currency)}
            icon={DollarSign}
            iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <SummaryCard
            title="浮动盈亏"
            value={`${totalPnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalPnl), snapshot.currency)}`}
            subtext={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
            icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
            iconColor={totalPnl >= 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: '总资产', value: '¥0.00', icon: Briefcase },
            { title: '总市值', value: '¥0.00', icon: TrendingUp },
            { title: '总现金', value: '¥0.00', icon: DollarSign },
            { title: '浮动盈亏', value: '¥0.00', icon: TrendingUp },
          ].map((item, i) => (
            <SummaryCard key={i} {...item} />
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions" className="gap-1.5">
            <Briefcase className="size-3.5" />
            持仓
          </TabsTrigger>
          <TabsTrigger value="trades" className="gap-1.5">
            <ChevronDown className="size-3.5" />
            交易
          </TabsTrigger>
          <TabsTrigger value="cash" className="gap-1.5">
            <Wallet className="size-3.5" />
            资金
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <Briefcase className="size-3.5" />
            公司行动
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-6 mt-4">
          {snapshot && snapshot.positions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Positions Table */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      持仓明细
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {snapshot.positions.length} 只
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PositionsTable
                      positions={snapshot.positions}
                      currency={snapshot.currency}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">持仓分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HoldingsPieChart
                      positions={snapshot.positions}
                      currency={snapshot.currency}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {snapshot && snapshot.positions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Briefcase className="size-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无持仓</p>
                <p className="text-xs mt-1">点击「记录交易」开始添加您的持仓</p>
              </CardContent>
            </Card>
          )}

          {!snapshot && loadingSnapshot && (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades" className="mt-4">
          <TradesHistoryTab accounts={accounts} />
        </TabsContent>

        {/* Cash Tab */}
        <TabsContent value="cash" className="mt-4">
          <CashLedgerTab accounts={accounts} />
        </TabsContent>

        {/* Corporate Actions Tab */}
        <TabsContent value="actions" className="mt-4">
          <CorporateActionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
