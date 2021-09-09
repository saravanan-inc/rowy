import { useState, ChangeEvent } from "react";
import createPersistedState from "use-persisted-state";
import _find from "lodash/find";
import _groupBy from "lodash/groupBy";

import {
  Container,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Fab,
  Checkbox,
  IconButton,
  Zoom,
  Fade,
} from "@material-ui/core";
import ViewListIcon from "@material-ui/icons/ViewListOutlined";
import ViewGridIcon from "@material-ui/icons/ViewModuleOutlined";
import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import EditIcon from "@material-ui/icons/EditOutlined";
import AddIcon from "@material-ui/icons/Add";

import FloatingSearch from "components/FloatingSearch";
import SlideTransition from "components/Modal/SlideTransition";
import TableGrid from "components/Home/TableGrid";
import TableList from "components/Home/TableList";
import TableGridSkeleton from "components/Home/TableGrid/TableGridSkeleton";
import TableListSkeleton from "components/Home/TableList/TableListSkeleton";
import HomeWelcomePrompt from "components/Home/HomeWelcomePrompt";
import AccessDenied from "components/Home/AccessDenied";
import EmptyState from "components/EmptyState";
import TableSettingsDialog, {
  TableSettingsDialogModes,
} from "components/TableSettings";

import routes from "constants/routes";
import { useAppContext } from "contexts/AppContext";
import { useProjectContext, Table } from "contexts/ProjectContext";
import useDoc, { DocActions } from "hooks/useDoc";
import useBasicSearch from "hooks/useBasicSearch";

import { SETTINGS } from "config/dbPaths";
import { APP_BAR_HEIGHT } from "components/Navigation";

const useHomeViewState = createPersistedState("__ROWY__HOME_VIEW");

export default function HomePage() {
  const { userDoc } = useAppContext();
  const { tables, userClaims } = useProjectContext();

  const [results, query, handleQuery] = useBasicSearch(
    tables ?? [],
    (table, query) =>
      table.id.toLowerCase().includes(query) ||
      table.name.toLowerCase().includes(query) ||
      table.section.toLowerCase().includes(query) ||
      table.description.toLowerCase().includes(query)
  );

  const [view, setView] = useHomeViewState("grid");

  const favorites = Array.isArray(userDoc.state.doc?.favoriteTables)
    ? userDoc.state.doc.favoriteTables
    : [];
  const sections = {
    Favorites: favorites.map((id) => _find(results, { id })),
    ..._groupBy(results, "section"),
  };

  const [settingsDialogState, setSettingsDialogState] = useState<{
    mode: null | TableSettingsDialogModes;
    data: null | (Table & { tableType: string });
  }>({ mode: null, data: null });

  const clearDialog = () =>
    setSettingsDialogState({
      mode: null,
      data: null,
    });

  const handleCreateTable = () =>
    setSettingsDialogState({
      mode: TableSettingsDialogModes.create,
      data: null,
    });

  const [settingsDocState] = useDoc(
    { path: SETTINGS },
    { createIfMissing: true }
  );

  if (!Array.isArray(tables))
    return (
      <Fade in style={{ transitionDelay: "1s" }} unmountOnExit>
        <div>
          {view === "list" ? <TableListSkeleton /> : <TableGridSkeleton />}
        </div>
      </Fade>
    );

  if (settingsDocState.error?.code === "permission-denied")
    return <AccessDenied />;

  const createTableFab = (
    <Tooltip title="Create Table">
      <Zoom in>
        <Fab
          color="secondary"
          aria-label="Create table"
          onClick={handleCreateTable}
          sx={{
            zIndex: "speedDial",
            position: "fixed",
            bottom: (theme) => ({
              xs: `max(${theme.spacing(2)}, env(safe-area-inset-bottom))`,
              sm: `max(${theme.spacing(3)}, env(safe-area-inset-bottom))`,
            }),
            right: (theme) => ({
              xs: `max(${theme.spacing(2)}, env(safe-area-inset-right))`,
              sm: `max(${theme.spacing(3)}, env(safe-area-inset-right))`,
            }),
          }}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Tooltip>
  );

  if (tables.length === 0) {
    if (userClaims.roles.includes("ADMIN"))
      return (
        <>
          <HomeWelcomePrompt />
          {createTableFab}
        </>
      );

    return (
      <EmptyState
        message="No Tables"
        description="There are no tables in this project. Sign in with an admin account to create tables."
        fullScreen
        style={{ marginTop: -APP_BAR_HEIGHT }}
      />
    );
  }

  const getLink = (table: Table) =>
    `${
      table.isCollectionGroup ? routes.tableGroup : routes.table
    }/${table.id.replace(/\//g, "~2F")}`;

  const handleFavorite = (id: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const newFavorites = e.target.checked
      ? [...favorites, id]
      : favorites.filter((f) => f !== id);

    userDoc.dispatch({
      action: DocActions.update,
      data: { favoriteTables: newFavorites },
    });
  };

  const getActions = (table: Table) => (
    <>
      {userClaims.roles.includes("ADMIN") && (
        <IconButton
          aria-label="Edit table"
          onClick={() =>
            setSettingsDialogState({
              mode: TableSettingsDialogModes.update,
              data: table as any,
            })
          }
          size={view === "list" ? "large" : undefined}
        >
          <EditIcon />
        </IconButton>
      )}
      <Checkbox
        onChange={handleFavorite(table.id)}
        checked={favorites.includes(table.id)}
        icon={<FavoriteBorderIcon />}
        checkedIcon={
          <Zoom in>
            <FavoriteIcon />
          </Zoom>
        }
        name={`favorite-${table.id}`}
        inputProps={{ "aria-label": "Favorite" }}
        sx={view === "list" ? { p: 1.5 } : undefined}
        color="secondary"
      />
    </>
  );

  return (
    <Container component="main" sx={{ px: 1, pt: 1, pb: 7 + 3 + 3 }}>
      <FloatingSearch
        label="Search Tables"
        onChange={(e) => handleQuery(e.target.value)}
        paperSx={{
          maxWidth: (theme) => ({ md: theme.breakpoints.values.sm - 48 }),
          mb: { xs: 2, md: -6 },
        }}
      />

      <SlideTransition in timeout={50}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{ pl: 2, cursor: "default" }}
          >
            {query ? `${results.length} of ${tables.length}` : tables.length}{" "}
            Tables
          </Typography>

          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => {
              if (v !== null) setView(v);
            }}
            aria-label="Table view"
            sx={{ "& .MuiToggleButton-root": { borderRadius: 2 } }}
          >
            <ToggleButton value="list" aria-label="List view">
              <ViewListIcon style={{ transform: "rotate(180deg)" }} />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Grid view">
              <ViewGridIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </SlideTransition>

      {view === "list" ? (
        <TableList
          sections={sections}
          getLink={getLink}
          getActions={getActions}
        />
      ) : (
        <TableGrid
          sections={sections}
          getLink={getLink}
          getActions={getActions}
        />
      )}

      {userClaims.roles.includes("ADMIN") && (
        <>
          {createTableFab}
          <TableSettingsDialog
            clearDialog={clearDialog}
            mode={settingsDialogState.mode}
            data={settingsDialogState.data}
          />
        </>
      )}
    </Container>
  );
}
