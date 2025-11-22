export const getSessions = async (params: { search?: string; status?: string }) => {
  const query = new URLSearchParams(params).toString();
  const url = `/api/sessions?${query}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};
