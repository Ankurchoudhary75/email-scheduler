import { Client } from '@elastic/elasticsearch';

const esNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
export const esClient = new Client({ node: esNode });

const INDEX_NAME = 'emails';

export async function initElasticsearch() {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              etherealPreviewUrl: { type: 'keyword' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' created successfully`);
    } else {
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' already exists`);
    }
  } catch (error) {
    console.error('[Elasticsearch] Initialization error (non-fatal):', error);
  }
}

export async function indexEmailDoc(emailJob: any, senderEmail: string) {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailJob.id,
      document: {
        id: emailJob.id,
        userId: emailJob.userId,
        senderEmail: senderEmail,
        recipient: emailJob.recipient,
        subject: emailJob.subject,
        body: emailJob.body,
        status: emailJob.status,
        scheduledAt: emailJob.scheduledAt,
        sentAt: emailJob.sentAt,
        etherealPreviewUrl: emailJob.etherealPreviewUrl,
        createdAt: emailJob.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Elasticsearch] Failed to index document ${emailJob.id}:`, error);
  }
}

export async function searchEmails(query: string, status?: string, userId?: string) {
  try {
    const mustConditions: any[] = [];
    if (userId) {
      mustConditions.push({ term: { userId } });
    }
    if (status) {
      mustConditions.push({ term: { status } });
    }

    if (query && query.trim() !== '') {
      mustConditions.push({
        multi_match: {
          query: query.trim(),
          fields: ['recipient^3', 'subject^2', 'body', 'senderEmail'],
          fuzziness: 'AUTO',
        },
      });
    }

    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: mustConditions.length > 0 ? { bool: { must: mustConditions } } : { match_all: {} },
        sort: [{ createdAt: { order: 'desc' } }],
      },
    });

    const hits = response.hits.hits.map((hit: any) => hit._source);
    return hits;
  } catch (error) {
    console.error('[Elasticsearch] Search failed:', error);
    return null; // Fallback to DB query if ES search fails
  }
}
