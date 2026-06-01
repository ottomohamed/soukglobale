import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useGetProduct(id: number, opts?: any) {
  return useQuery({
    queryKey: ["/api/products", id],
    queryFn: () => apiFetch(`/products/${id}`),
    enabled: !!id,
    ...opts?.query,
  });
}

export function useListProducts(params?: Record<string, any>, opts?: any) {
  const qs = params ? "?" + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString() : "";
  return useQuery({
    queryKey: ["/api/products", params],
    queryFn: () => apiFetch(`/products${qs}`),
    ...opts?.query,
  });
}

export function useListVendors(params?: Record<string, any>, opts?: any) {
  const qs = params ? "?" + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString() : "";
  return useQuery({
    queryKey: ["/api/vendors", params],
    queryFn: () => apiFetch(`/vendors${qs}`),
    ...opts?.query,
  });
}

export function useGetVendor(id: number, opts?: any) {
  return useQuery({
    queryKey: ["/api/vendors", id],
    queryFn: () => apiFetch(`/vendors/${id}`),
    enabled: !!id,
    ...opts?.query,
  });
}

export function useGetStats(opts?: any) {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => apiFetch("/stats"),
    ...opts?.query,
  });
}

export function useListOrders(params?: Record<string, any>, opts?: any) {
  const qs = params ? "?" + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString() : "";
  return useQuery({
    queryKey: ["/api/orders", params],
    queryFn: () => apiFetch(`/orders${qs}`),
    ...opts?.query,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/products"] }),
  });
}

export function useCreateVendor() {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
}
