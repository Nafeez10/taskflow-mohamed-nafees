import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/utils/date";
import type { Project } from "@/types";
import { ArrowRight } from "lucide-react";

interface Props {
  project: Project;
  /** True when the current user is a contributor rather than the owner */
  isContributor?: boolean;
}

const ProjectCard = ({ project, isContributor = false }: Props) => (
  <Link to={`/projects/${project.id}`} className="block h-full">
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {project.name}
          </CardTitle>

          {isContributor && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Contributor
            </Badge>
          )}
        </div>

        {project.description && (
          <CardDescription className="line-clamp-2 text-sm mt-1">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>Created {formatRelative(project.created_at)}</span>
        <ArrowRight className="h-4 w-4" />
      </CardFooter>
    </Card>
  </Link>
);

export default ProjectCard;
