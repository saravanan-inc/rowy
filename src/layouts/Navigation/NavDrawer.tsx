import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { find, groupBy } from "lodash-es";
import { colord } from "colord";

import {
  alpha,
  Drawer,
  DrawerProps,
  Stack,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemSecondaryAction,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/MenuOpen";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import AddIcon from "@mui/icons-material/Add";
import DocsIcon from "@mui/icons-material/LibraryBooksOutlined";
import LearningIcon from "@mui/icons-material/LocalLibraryOutlined";
import HelpIcon from "@mui/icons-material/HelpOutline";
import CommunityIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import InlineOpenInNewIcon from "@src/components/InlineOpenInNewIcon";
import {
  ChevronRight as ChevronRightIcon,
  Checklist as ChecklistIcon,
} from "@src/assets/icons";

import Logo from "@src/assets/Logo";
import NavItem from "./NavItem";
import SettingsNav from "./SettingsNav";
import NavTableSection from "./NavTableSection";
import Progress from "./GetStartedChecklist/Progress";
import CommunityMenu from "./CommunityMenu";
import HelpMenu from "./HelpMenu";

import {
  globalScope,
  userSettingsAtom,
  tablesAtom,
  tableSettingsDialogAtom,
  getStartedChecklistAtom,
} from "@src/atoms/globalScope";
import { TableSettings } from "@src/types/table";
import { ROUTES } from "@src/constants/routes";
import { EXTERNAL_LINKS, WIKI_LINKS } from "@src/constants/externalLinks";
import { TOP_BAR_HEIGHT } from "./TopBar";

export const NAV_DRAWER_WIDTH = 256;
export const NAV_DRAWER_COLLAPSED_WIDTH = 56;

export interface INavDrawerProps extends DrawerProps {
  open: boolean;
  isPermanent: boolean;
  onClose: NonNullable<DrawerProps["onClose"]>;
}

export default function NavDrawer({
  open,
  isPermanent,
  onClose,
}: INavDrawerProps) {
  const [tables] = useAtom(tablesAtom, globalScope);
  const [userSettings] = useAtom(userSettingsAtom, globalScope);
  const openTableSettingsDialog = useSetAtom(
    tableSettingsDialogAtom,
    globalScope
  );
  const openGetStartedChecklist = useSetAtom(
    getStartedChecklistAtom,
    globalScope
  );

  const [hover, setHover] = useState(false);
  const [communityMenuAnchorEl, setCommunityMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [helpMenuAnchorEl, setHelpMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const menuOpen = communityMenuAnchorEl || helpMenuAnchorEl;

  const favorites = Array.isArray(userSettings.favoriteTables)
    ? userSettings.favoriteTables
    : [];
  const sections = {
    Favorites: favorites
      .map((id) => find(tables, { id }))
      .filter((x) => x !== undefined) as TableSettings[],
    ...groupBy(tables, "section"),
  };

  const collapsed = !open && isPermanent;
  const tempExpanded = (hover || menuOpen) && collapsed;
  const width =
    collapsed && !tempExpanded ? NAV_DRAWER_COLLAPSED_WIDTH : NAV_DRAWER_WIDTH;
  const closeDrawer = isPermanent
    ? undefined
    : (e: {}) => onClose(e, "escapeKeyDown");

  const externalLinkIcon = (
    <ListItemSecondaryAction sx={{ right: 10 }}>
      <InlineOpenInNewIcon />
    </ListItemSecondaryAction>
  );

  return (
    <>
      <Drawer
        open={isPermanent || open}
        onClose={onClose}
        hideBackdrop={isPermanent}
        ModalProps={{ disablePortal: true }}
        variant={isPermanent ? "permanent" : "temporary"}
        anchor="left"
        sx={[
          {
            width,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width,
              pt: 0,
              scrollbarWidth: "thin",

              "--nav-bg": (theme) =>
                colord(theme.palette.background.paper)
                  .mix("#fff", 0.09) // elevation 8
                  .alpha(1)
                  .toHslString(),
              bgcolor: "var(--nav-bg)",
              backgroundImage: "none",
            },
          },
          isPermanent && {
            position: "fixed",
            zIndex: (theme) => theme.zIndex.appBar - 1,

            "& .MuiDrawer-paper": {
              mt: `${TOP_BAR_HEIGHT - 4}px`,
              height: `calc(100% - ${TOP_BAR_HEIGHT - 4}px)`,
              pt: 0.5,
              borderRadius: 2,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,

              width,
              transitionProperty:
                "width, transform, background-color, box-shadow",
              transitionTimingFunction: "var(--nav-transition-timing-function)",
              transitionDuration: "var(--nav-transition-duration)",
              overflowX: "hidden",

              borderRight: "none",
              "--nav-bg": (theme) => theme.palette.background.default,
            },

            "& .MuiListItemSecondaryAction-root": {
              transitionProperty: "opacity",
              transitionTimingFunction: "var(--nav-transition-timing-function)",
              transitionDuration: "var(--nav-transition-duration)",
            },
          },
          collapsed &&
            !tempExpanded && {
              "& .MuiDrawer-paper": {
                scrollbarWidth: "none",
                "::-webkit-scrollbar": { display: "none" },
              },
              "& .MuiListItemSecondaryAction-root": {
                opacity: 0,
                transitionDelay: "0ms",
              },
            },
          tempExpanded && {
            zIndex: "drawer",
            "& .MuiDrawer-paper": {
              "--nav-bg": (theme) =>
                colord(theme.palette.background.paper)
                  .mix("#fff", 0.09) // elevation 8
                  .alpha(1)
                  .toHslString(),
              boxShadow: (theme) =>
                theme.shadows[4].replace(/, 0 (\d+px)/g, ", $1 0"),
            },
          },
        ]}
        PaperProps={{
          elevation: isPermanent ? 0 : 8,
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
        }}
      >
        {!isPermanent && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              height: TOP_BAR_HEIGHT,
              flexShrink: 0,
              px: 0.5,
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "var(--nav-bg)",
            }}
          >
            <IconButton
              aria-label="Close navigation drawer"
              onClick={onClose as any}
              size="large"
            >
              <CloseIcon />
            </IconButton>

            <Logo style={{ marginLeft: 1, position: "relative", zIndex: 1 }} />
          </Stack>
        )}

        <nav style={{ flexGrow: 1 }}>
          <List
            component="ol"
            disablePadding
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "static",
              backgroundColor: "var(--nav-bg)",
            }}
          >
            <li>
              <NavItem to={ROUTES.tables} onClick={closeDrawer}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </NavItem>
            </li>

            <SettingsNav
              closeDrawer={closeDrawer as any}
              collapsed={isPermanent && !open && !tempExpanded}
            />

            <Divider variant="middle" sx={{ my: 1 }} />

            {sections &&
              Object.entries(sections)
                .filter(([, tables]) => tables.length > 0)
                .map(([section, tables]) => (
                  <NavTableSection
                    key={section}
                    section={section}
                    tables={tables}
                    closeDrawer={closeDrawer}
                    collapsed={isPermanent && !open && !tempExpanded}
                  />
                ))}

            <li>
              <NavItem
                {...({ component: "button" } as any)}
                onClick={(e: any) => {
                  if (closeDrawer) closeDrawer(e);
                  openTableSettingsDialog({});
                }}
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="Create table…" />
              </NavItem>
            </li>

            <List
              component="li"
              disablePadding
              sx={{
                position: "sticky",
                bottom: 0,
                bgcolor: "var(--nav-bg)",
                mt: "auto",
                pb: 1,
              }}
            >
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <Divider variant="middle" sx={{ mb: 1 }} />

                <li>
                  <NavItem
                    onClick={() => {
                      openGetStartedChecklist(true);
                      setHover(false);
                    }}
                    sx={{
                      mb: 1,
                      py: 0.5,
                      bgcolor: (theme) =>
                        alpha(
                          theme.palette.primary.main,
                          theme.palette.action.selectedOpacity
                        ),
                      "&:hover": {
                        bgcolor: (theme) =>
                          alpha(
                            theme.palette.primary.main,
                            theme.palette.action.selectedOpacity +
                              theme.palette.action.hoverOpacity
                          ),
                      },
                      "& *, &&:hover *": {
                        color: (theme) =>
                          theme.palette.primary[
                            theme.palette.mode === "dark" ? "light" : "dark"
                          ],
                      },
                    }}
                  >
                    <ListItemIcon>
                      <ChecklistIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Get started"
                      secondary={<Progress sx={{ mr: 3 }} />}
                    />
                    <ListItemSecondaryAction>
                      <ChevronRightIcon />
                    </ListItemSecondaryAction>
                  </NavItem>
                </li>

                <li>
                  <NavItem href={EXTERNAL_LINKS.docs}>
                    <ListItemIcon>
                      <DocsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Docs" />
                    {externalLinkIcon}
                  </NavItem>
                </li>

                <li>
                  <NavItem href={WIKI_LINKS.howTo}>
                    <ListItemIcon>
                      <LearningIcon />
                    </ListItemIcon>
                    <ListItemText primary="Learning" />
                    {externalLinkIcon}
                  </NavItem>
                </li>

                <li>
                  <NavItem
                    onClick={(e: any) =>
                      setCommunityMenuAnchorEl(e.currentTarget)
                    }
                  >
                    <ListItemIcon>
                      <CommunityIcon />
                    </ListItemIcon>
                    <ListItemText primary="Join our community" />
                    <ListItemSecondaryAction>
                      <ChevronRightIcon />
                    </ListItemSecondaryAction>
                  </NavItem>
                  <CommunityMenu
                    anchorEl={communityMenuAnchorEl}
                    onClose={() => setCommunityMenuAnchorEl(null)}
                  />
                </li>

                <li>
                  <NavItem
                    onClick={(e: any) => setHelpMenuAnchorEl(e.currentTarget)}
                  >
                    <ListItemIcon>
                      <HelpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Help" />
                    <ListItemSecondaryAction>
                      <ChevronRightIcon />
                    </ListItemSecondaryAction>
                  </NavItem>
                  <HelpMenu
                    anchorEl={helpMenuAnchorEl}
                    onClose={() => setHelpMenuAnchorEl(null)}
                  />
                </li>
              </ol>
            </List>
          </List>
        </nav>
      </Drawer>

      {isPermanent && (
        <Box
          sx={{
            flexShrink: 0,
            flexGrow: 0,
            width: open ? NAV_DRAWER_WIDTH : NAV_DRAWER_COLLAPSED_WIDTH,
            transitionProperty: "width",
            transitionTimingFunction: "var(--nav-transition-timing-function)",
            transitionDuration: "var(--nav-transition-duration)",
          }}
        />
      )}
    </>
  );
}
