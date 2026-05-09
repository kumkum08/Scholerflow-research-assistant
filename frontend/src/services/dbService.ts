import Dexie, { Table } from 'dexie';

export type MessagePayload = {
  role: 'user' | 'ai';
  content: string;
};

export const DEFAULT_PROJECT_ID_PREFIX = 'default-project';

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SectionDraft {
  id?: string;
  userId: string;
  projectId?: string;
  section: string;
  messages: MessagePayload[];
  updatedAt: number;
}

export interface ImportedDocument {
  id?: number;
  userId: string;
  projectId?: string;
  fileName: string;
  content: string;
  importedAt: number;
}

class ScholarFlowDB extends Dexie {
  projects!: Table<ProjectRecord, string>;
  sectionDrafts!: Table<SectionDraft, string>;
  documents!: Table<ImportedDocument, number>;

  constructor() {
    super('ScholarFlowDB_v2');

    this.version(1).stores({
      sectionDrafts: '&id,userId,section,updatedAt,[userId+section]',
      documents: '++id,userId,fileName,importedAt',
    });

    this.version(2).stores({
      projects: '&id,userId,updatedAt,[userId+updatedAt]',
      sectionDrafts: '&id,userId,projectId,section,updatedAt,[userId+section],[userId+projectId]',
      documents: '++id,userId,projectId,fileName,importedAt,[userId+projectId]',
    });
  }
}

const db = new ScholarFlowDB();

const getSectionDraftId = (userId: string, projectId: string, section: string) => `${userId}:${projectId}:${section}`;
export const getDefaultProjectId = (userId: string) => `${DEFAULT_PROJECT_ID_PREFIX}:${userId}`;
export const isDefaultProjectId = (projectId: string) => projectId.startsWith(`${DEFAULT_PROJECT_ID_PREFIX}:`);

export const getDefaultProject = (userId: string): ProjectRecord => ({
  id: getDefaultProjectId(userId),
  userId,
  name: 'Project 01',
  description: 'Your default ScholarFlow workspace',
  createdAt: 0,
  updatedAt: 0,
});

export const ensureDefaultProject = async (userId: string) => {
  const defaultProjectId = getDefaultProjectId(userId);
  const existing = await db.projects.get(defaultProjectId);
  if (!existing) {
    const now = Date.now();
    await db.projects.put({
      ...getDefaultProject(userId),
      createdAt: now,
      updatedAt: now,
    });
  }

  return (await db.projects.get(defaultProjectId)) || getDefaultProject(userId);
};

export const getAllProjects = async (userId: string) => {
  await ensureDefaultProject(userId);
  const projects = await db.projects.where('userId').equals(userId).sortBy('updatedAt');
  return projects.reverse();
};

export const createProject = async (userId: string, name: string, description?: string) => {
  const now = Date.now();
  const id = crypto.randomUUID();
  const trimmedDescription = description?.trim();
  const project: ProjectRecord = {
    id,
    userId,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
  };

  await db.projects.put(project);
  return project;
};

export const updateProject = async (projectId: string, updates: Pick<ProjectRecord, 'name' | 'description'>) => {
  const existing = await db.projects.get(projectId);
  if (!existing) {
    throw new Error('Project not found');
  }

  const trimmedDescription = updates.description?.trim();
  const nextProjectBase = {
    id: existing.id,
    userId: existing.userId,
    name: updates.name.trim(),
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  const nextProject: ProjectRecord = trimmedDescription
    ? { ...nextProjectBase, description: trimmedDescription }
    : nextProjectBase;

  await db.projects.put(nextProject);
  return nextProject;
};

export const deleteProject = async (userId: string, projectId: string) => {
  if (projectId === getDefaultProjectId(userId)) {
    throw new Error('Default project cannot be deleted');
  }

  const drafts = await db.sectionDrafts.where('userId').equals(userId).toArray();
  const docs = await db.documents.where('userId').equals(userId).toArray();

  await db.transaction('rw', db.projects, db.sectionDrafts, db.documents, async () => {
    await db.projects.delete(projectId);

    const projectDraftIds = drafts
      .filter((draft) => draft.projectId === projectId)
      .map((draft) => draft.id)
      .filter((draftId): draftId is string => Boolean(draftId));

    const projectDocIds = docs
      .filter((doc) => doc.projectId === projectId)
      .map((doc) => doc.id)
      .filter((docId): docId is number => typeof docId === 'number');

    if (projectDraftIds.length > 0) {
      await db.sectionDrafts.bulkDelete(projectDraftIds);
    }

    if (projectDocIds.length > 0) {
      await db.documents.bulkDelete(projectDocIds);
    }
  });
};

export const getAllSectionDrafts = async (userId: string, projectId: string = getDefaultProjectId(userId)) => {
  const drafts = await db.sectionDrafts.where('userId').equals(userId).toArray();
  return drafts.filter((draft) => draft.projectId === projectId || (!draft.projectId && projectId === getDefaultProjectId(userId)));
};

export const getSectionDraft = async (userId: string, section: string, projectId: string = getDefaultProjectId(userId)) => {
  return await db.sectionDrafts.get(getSectionDraftId(userId, projectId, section));
};

export const saveSectionDraft = async (userId: string, projectId: string, section: string, messages: MessagePayload[]) => {
  return await db.sectionDrafts.put({
    id: getSectionDraftId(userId, projectId, section),
    userId,
    projectId,
    section,
    messages,
    updatedAt: Date.now(),
  });
};

export const deleteSectionDraft = async (userId: string, projectId: string, section: string) => {
  return await db.sectionDrafts.delete(getSectionDraftId(userId, projectId, section));
};

export const getAllImportedDocuments = async (userId: string, projectId: string = getDefaultProjectId(userId)) => {
  const docs = await db.documents.where('userId').equals(userId).toArray();
  return docs
    .filter((doc) => doc.projectId === projectId || (!doc.projectId && projectId === getDefaultProjectId(userId)))
    .sort((a, b) => b.importedAt - a.importedAt);
};

export const saveImportedDocument = async (userId: string, projectId: string, fileName: string, content: string) => {
  return await db.documents.add({
    userId,
    projectId,
    fileName,
    content,
    importedAt: Date.now(),
  });
};
