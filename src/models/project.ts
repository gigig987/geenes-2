const uuidv4 = () => new Date().valueOf();

export interface Project {
  name: string | undefined;
  preferences?: {
    [key: string]: string | number | Array<string | number>;
  }
}
export interface ProjectOptions {
  storageKey?: string;
}

export interface ProjectModelObserver {
  onAdd(key: number, value: Project): void;
  onUpdate(key: number, value: Project): void;
  onRemove(key: number): void;
}
export default class ProjectModel {
  #client: ProjectModelObserver | null = null;
  #storageKey = '';
  #projects = new Map();

  constructor(client: ProjectModelObserver, options: ProjectOptions = {}) {
    this.#storageKey = options.storageKey || 'projects';
    this.#client = client;
    const asJson = localStorage.getItem(this.#storageKey);
    if (asJson) {
      this.#projects = new Map(JSON.parse(asJson));
      for (const [key, value] of this.#projects.entries())
        this.#client.onAdd(key, value);
    }
  }

  #validate(project: Project | null): Project | null{
    project = { preferences: project?.preferences, name: project?.name?.trim() };
    return project.name?.length ? project : null;
  }

  #save() {
    localStorage.setItem(this.#storageKey, JSON.stringify(Array.from(this.#projects.entries())));
  }

  createProject(project: Project | null): void {
    project = this.#validate(project)
    if (!project)
      return;
    const key = uuidv4();
    this.#projects.set(key, project);
    this.#client?.onAdd(key, project);
    this.#save();
  }

  getProject(key: number) {
    return this.#projects.get(key);
  }

  updateProject(key: number, update: Partial<Project>): void {
    let project = this.#projects.get(key);
    if (!project) {
      return;
    }
    project = {...project, ...update};
    project = this.#validate(project);
    if (!project) {
      this.deleteProject(key);
      return;
    }

    this.#projects.set(key, project);
    this.#client?.onUpdate(key, project);
    this.#save();
  }

  deleteProject(key: number) : void {
    this.#projects.delete(key);
    this.#client?.onRemove(key);
    this.#save();
  }
}