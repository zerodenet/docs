<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Discussion {
  number: number
  title: string
  html_url: string
  comments: number
  created_at: string
  updated_at: string
  user: {
    login: string
  }
  category: {
    name: string
  }
}

const props = withDefaults(defineProps<{
  repo: string
  organization: string
  limit?: number
}>(), {
  limit: 6,
})

const available = ref(false)
const discussions = ref<Discussion[]>([])

const discussionsUrl = `https://github.com/orgs/${props.organization}/discussions`
const newDiscussionUrl = `${discussionsUrl}/new/choose`

const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}).format(new Date(value))

onMounted(async () => {
  try {
    const response = await fetch(`https://api.github.com/repos/${props.repo}/discussions?per_page=20&sort=updated&direction=desc`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) return

    const data = await response.json() as Discussion[]
    discussions.value = data.slice(0, props.limit)
    available.value = true
  } catch {
    // Discussions are optional. Keep the community page usable when GitHub is unavailable.
  }
})
</script>

<template>
  <section v-if="available" id="讨论" class="discussion-feed">
    <header class="discussion-feed__header">
      <div>
        <h2>讨论</h2>
        <p>GitHub Discussions</p>
      </div>
      <nav aria-label="GitHub Discussions">
        <a :href="discussionsUrl" target="_blank" rel="noreferrer">查看全部</a>
        <a :href="newDiscussionUrl" target="_blank" rel="noreferrer">发起讨论</a>
      </nav>
    </header>

    <div v-if="discussions.length" class="discussion-feed__list">
      <a
        v-for="discussion in discussions"
        :key="discussion.number"
        :href="discussion.html_url"
        class="discussion-feed__item"
        target="_blank"
        rel="noreferrer"
      >
        <span class="discussion-feed__category">{{ discussion.category.name }}</span>
        <strong>{{ discussion.title }}</strong>
        <span class="discussion-feed__meta">
          {{ discussion.user.login }} · {{ discussion.comments }} 条回复 · {{ formatDate(discussion.updated_at) }}
        </span>
      </a>
    </div>

    <p v-else class="discussion-feed__empty">
      暂无讨论。<a :href="newDiscussionUrl" target="_blank" rel="noreferrer">发起第一个讨论</a>
    </p>
  </section>
</template>

<style scoped>
.discussion-feed {
  margin: 32px 0 40px;
}

.discussion-feed__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.discussion-feed__header h2 {
  margin: 0;
  border: 0;
}

.discussion-feed__header p {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.discussion-feed__header nav {
  display: flex;
  gap: 14px;
  white-space: nowrap;
}

.discussion-feed__list {
  border-top: 1px solid var(--vp-c-divider);
}

.discussion-feed__item {
  display: grid;
  grid-template-columns: minmax(90px, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.discussion-feed__item:hover strong {
  color: var(--vp-c-brand-1);
}

.discussion-feed__category {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.discussion-feed__item strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.discussion-feed__meta {
  color: var(--vp-c-text-2);
  font-size: 12px;
  white-space: nowrap;
}

.discussion-feed__empty {
  padding: 16px 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .discussion-feed__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .discussion-feed__item {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .discussion-feed__meta {
    white-space: normal;
  }
}
</style>
