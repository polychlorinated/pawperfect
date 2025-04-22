import { Loader2, Calendar, Clock, Bell, User, Package, PawPrint } from "lucide-react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const Icons = {
  spinner: Loader2,
  calendar: Calendar,
  clock: Clock,
  bell: Bell,
  user: User,
  package: Package,
  paw: PawPrint,
};