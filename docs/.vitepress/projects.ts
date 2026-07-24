import rawProjects from './projects.json'

export type ProjectKind =
  | 'application'
  | 'kernel'
  | 'service'
  | 'sdk'
  | 'tool'
  | 'specification'

export type ProjectStatus = 'incubating' | 'preview' | 'active' | 'deprecated' | 'archived'

export interface ProjectDefinition {
  id: string
  name: string
  tagline?: string
  description: string
  kind: ProjectKind
  status: ProjectStatus
  repository: string
  docsRoot: string
  quickStart?: string
  download?: string
  platforms?: string[]
  audiences: string[]
}

export const projectKindLabels: Record<ProjectKind, string> = {
  application: '应用',
  kernel: '内核',
  service: '服务',
  sdk: 'SDK',
  tool: '工具',
  specification: '规范',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  incubating: '孵化中',
  preview: '预览',
  active: '持续维护',
  deprecated: '已弃用',
  archived: '已归档',
}

export const projects = rawProjects as ProjectDefinition[]

export function getProject(projectId: string): ProjectDefinition {
  const project = projects.find(({ id }) => id === projectId)

  if (!project) {
    throw new Error(`Unknown project: ${projectId}`)
  }

  return project
}
