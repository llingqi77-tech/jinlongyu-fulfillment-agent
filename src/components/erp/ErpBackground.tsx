export function ErpBackground() {
  return (
    <div className="erp-background flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-4 border-b border-pale-stone/20 bg-paper-canvas px-6 py-3">
        <span className="text-sm font-semibold text-ink">易分销 Plus</span>
        <nav className="flex gap-4 text-xs text-muted">
          <span className="text-ink">订单管理</span>
          <span>库存查询</span>
          <span>客户档案</span>
          <span>报表中心</span>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <h1 className="mb-4 text-lg font-semibold text-ink">销售订单列表</h1>
        <div className="min-h-0 flex-1 overflow-hidden rounded-card border border-pale-stone/15 bg-paper-canvas">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-segment-track/80 text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">订单号</th>
                <th className="px-4 py-2 font-medium">客户</th>
                <th className="px-4 py-2 font-medium">金额</th>
                <th className="px-4 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {['SO-10021', 'SO-10022', 'SO-10023', 'SO-10024'].map((id, i) => (
                <tr key={id} className={i % 2 === 0 ? 'bg-paper-canvas' : 'bg-segment-track/30'}>
                  <td className="px-4 py-2.5 font-mono">{id}</td>
                  <td className="px-4 py-2.5">酒店客户 {i + 1}</td>
                  <td className="px-4 py-2.5">¥{(12000 + i * 3400).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted">已审核</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
