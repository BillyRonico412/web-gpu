import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/hello-triangle')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/hello-triangle"!</div>
}
