'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { PortfolioAccount } from '@/types/portfolio';

interface TradeFormProps {
  accounts: PortfolioAccount[];
  onSubmitted?: () => void;
}

export function TradeForm({ accounts, onSubmitted }: TradeFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accountId: '',
    symbol: '',
    tradeDate: new Date().toISOString().slice(0, 10),
    side: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    fee: '0',
    tax: '0',
    note: '',
  });

  // Reset account when accounts list changes
  useEffect(() => {
    if (accounts.length > 0 && !form.accountId) {
      setForm((f) => ({ ...f, accountId: accounts[0].id }));
    }
  }, [accounts, form.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.accountId) {
      toast.error('请选择账户');
      return;
    }
    if (!form.symbol.trim()) {
      toast.error('请输入股票代码');
      return;
    }
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      toast.error('请输入有效数量');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error('请输入有效价格');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity),
          price: parseFloat(form.price),
          fee: parseFloat(form.fee) || 0,
          tax: parseFloat(form.tax) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }

      toast.success(`${form.side === 'buy' ? '买入' : '卖出'}记录已添加`);
      setOpen(false);
      setForm({
        accountId: accounts[0]?.id || '',
        symbol: '',
        tradeDate: new Date().toISOString().slice(0, 10),
        side: 'buy',
        quantity: '',
        price: '',
        fee: '0',
        tax: '0',
        note: '',
      });
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-3.5" />
          记录交易
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowUpDown className="size-4" />
            记录交易
          </SheetTitle>
          <SheetDescription>
            手动添加买入或卖出交易记录
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Account */}
          <div className="space-y-2">
            <Label>交易账户 *</Label>
            <Select
              value={form.accountId}
              onValueChange={(v) => setForm({ ...form, accountId: v })}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择账户" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acct) => (
                  <SelectItem key={acct.id} value={acct.id}>
                    {acct.name} ({acct.baseCurrency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Side */}
          <div className="space-y-2">
            <Label>方向 *</Label>
            <Select
              value={form.side}
              onValueChange={(v) => setForm({ ...form, side: v as 'buy' | 'sell' })}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">买入</span>
                </SelectItem>
                <SelectItem value="sell">
                  <span className="text-red-600 dark:text-red-400 font-medium">卖出</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Symbol */}
          <div className="space-y-2">
            <Label htmlFor="trade-symbol">股票代码 *</Label>
            <Input
              id="trade-symbol"
              placeholder="例如: 600519 或 AAPL"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="trade-date">交易日期 *</Label>
            <Input
              id="trade-date"
              type="date"
              value={form.tradeDate}
              onChange={(e) => setForm({ ...form, tradeDate: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade-qty">数量 *</Label>
              <Input
                id="trade-qty"
                type="number"
                step="any"
                min="0"
                placeholder="100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade-price">价格 *</Label>
              <Input
                id="trade-price"
                type="number"
                step="any"
                min="0"
                placeholder="10.50"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Fee & Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade-fee">手续费</Label>
              <Input
                id="trade-fee"
                type="number"
                step="any"
                min="0"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade-tax">印花税</Label>
              <Input
                id="trade-tax"
                type="number"
                step="any"
                min="0"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="trade-note">备注</Label>
            <Textarea
              id="trade-note"
              placeholder="可选备注..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '提交中...' : form.side === 'buy' ? '确认买入' : '确认卖出'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
