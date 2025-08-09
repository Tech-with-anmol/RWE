import { HandHelpingIcon, HelpCircle, Home, Search, Settings, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar"


const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
  {
    title: "Help",
    url: "#",
    icon: HandHelpingIcon, 
  },
  {
    title: "About",
    url: "#",
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="text-lg font-semibold">RWE</span>
            <span className="text-sm text-muted-foreground">v1.0</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenuItem>
         <SidebarMenuButton asChild>
           <a href="#">
             <span >Topic name</span>
           </a>
      
         </SidebarMenuButton>
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <SidebarMenuAction>
               <MoreHorizontal />
             </SidebarMenuAction>
           </DropdownMenuTrigger>
           <DropdownMenuContent side="right" align="start">
             <DropdownMenuItem>
               <span>Edit Name</span>
             </DropdownMenuItem>
             <DropdownMenuItem>
               <span>Delete</span>
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
        </SidebarMenuItem>
      </SidebarContent>
    </Sidebar>
  )
}