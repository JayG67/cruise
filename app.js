function selectStack(stack) {
  switch(stack) {
    case 'vanilla':
      window.location.href = 'public/vanilla.html'
      break
    case 'react':
      window.location.href = '/react'
      break
    case 'fullstack':
      window.location.href = '/dashboard.html'
      break
    default:
      alert('Coming soon!')
  }
}