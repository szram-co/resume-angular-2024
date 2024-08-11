async function loadServer() {
  const serverModule = await import('../dist/resume-angular-2024/server/server.mjs')
  return serverModule.app
}

export default loadServer().then((app) => app())
