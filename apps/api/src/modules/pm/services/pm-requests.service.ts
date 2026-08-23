import { Injectable } from "@nestjs/common";

import { ProjectsService } from "../../projects/services/projects.service";

@Injectable()
export class PmRequestsService {
  constructor(private readonly projectsService: ProjectsService) {}

  list(userId: string) {
    return this.projectsService.findPmRevisions(userId);
  }
}
