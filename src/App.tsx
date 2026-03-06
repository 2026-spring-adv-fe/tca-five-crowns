import './App.css'
import {
  HashRouter
  , Routes
  , Route
} from 'react-router';
import { AppTitle, Home } from './Home';
import { Setup } from './Setup';
import { Play } from './Play';
import { useEffect, useRef, useState } from 'react';
import {
  GameResult
  , getAverageGameDurationsByPlayerCount
  , getGeneralFacts
  , getGoOutsPerGameLeaderboard
  , getHighestSingleHandScoreLeaderboard
  , getLeaderboard
  , getPreviousPlayers
  , getGamesByMonth,
  getGameHistoryData,
  getLowestScoreAllTimeData,
  getGamesPlayedTrendChartData,
  getScoreDistributionData,
  getAvgScoreLeaderboard,
} from './GameResults';
import localforage from 'localforage';

import {
  saveGameToCloud
  , loadGamesFromCloud
} from './tca-cloud-api';

const getLookbackDate = (date: Date, token: string) => {
  const d = new Date(date);
  const match = token.match(/^(\d+)(d|mo)$/);

  if (!match) throw new Error("Invalid token");

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "d") {
    return new Date(d.getTime() - value * 24 * 60 * 60 * 1000);
  }

  if (unit === "mo") {
    const result = new Date(d);
    result.setMonth(d.getMonth() - value);
    return result;
  }
};

const App = () => {

  //
  // Hooks...
  //
  // My order pref is... Ref hooks, state hooks, effect hooks ! ! !
  //
  const emailModalRef = useRef<HTMLDialogElement | null>(null);

  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  const [title, setTitle] = useState(AppTitle);

  const [currentPlayers, setCurrentPlayers] = useState<string[]>([]);

  const [emailOnModal, setEmailOnModal] = useState("");

  const [emailForCloudApi, setEmailForCloudApi] = useState("");

  const [statRangeLookback, setStatRangeLookback] = useState("0d");

  useEffect(
    () => {

      const loadStatRangeLookback = async () => {

        const savedStatRangeLookback = await localforage.getItem<string>("statRangeLookback") ?? "0d";

        if (!ignore) {
          setStatRangeLookback(savedStatRangeLookback);
        }
      };

      //
      // Build the ignore-sandwich...
      //

      // Bread on top...
      let ignore = false;

      loadStatRangeLookback();

      // Bread on bottom...
      return () => {
        ignore = true;
      };
    }
    , []
  );
  
  useEffect(
    () => {

      const loadEmail = async () => {

        const savedEmail = await localforage.getItem<string>("email") ?? "";

        if (!ignore) {
          setEmailOnModal(savedEmail);

          if (savedEmail.length > 0) {
            setEmailForCloudApi(savedEmail);
          }
        }
      };

      //
      // Build the ignore-sandwich...
      //

      // Bread on top...
      let ignore = false;

      loadEmail();

      // Bread on bottom...
      return () => {
        ignore = true;
      };
    }
    , []
  );

  useEffect(
    () => {

      const loadGameResults = async () => {

        const savedGameResults = await loadGamesFromCloud(
          emailForCloudApi
          , "tca-five-crowns-25s"
        );

        if (!ignore) {
          setGameResults(savedGameResults);
        }
      };

      //
      // Build the ignore-sandwich...
      //

      // Bread on top...
      let ignore = false;

      if (emailForCloudApi.length > 0) {
        loadGameResults();
      }
      else {
        setGameResults([]);
      }

      // Bread on bottom...
      return () => {
        ignore = true;
      };
    }
    , [emailForCloudApi]
  );

  //
  // Other code (not hooks)...
  //
  const addNewGameResult = async (
    newGameResult: GameResult
    , email: string
  ) => {
    // Save the game to the cloud via the cloud api...
    await saveGameToCloud(
      email.length > 0
        ? email
        : "unknown@tomfixthis.com"
      , "tca-five-crowns-25s"
      , newGameResult.end
      , newGameResult
    );

    // Optimistically update the lifted state with the new game result...
    setGameResults(
      [
        ...gameResults
        , newGameResult
      ]
    );
  };

  const saveEmail = async (emailToSave: string) => {
    const savedEmail = await localforage.setItem(
      "email"
      , emailToSave
    );

    setEmailOnModal(savedEmail);
    setEmailForCloudApi(savedEmail);
  };

  const lookbackDate = getLookbackDate(new Date(), statRangeLookback);

  const filteredGameResults = lookbackDate === undefined || statRangeLookback === "0d"
    ? gameResults
    : gameResults.filter(
      x => Date.parse(x.end) >= lookbackDate.getTime()
    );

  const statRangeLookbackSelected = async (
    event: any,
    selectedStatRangeLookback: string,
  ) => {
    event.currentTarget.blur(); 
    const savedStatRangeLookback = await localforage.setItem("statRangeLookback", selectedStatRangeLookback);
    setStatRangeLookback(savedStatRangeLookback);
  };

  //
  // Finally, return the JSX, using any of the state and calculated items
  // from above...
  //
  return (
    <div
      className='p-0 overflow-x-hidden min-h-screen'
      data-theme="light"
    >
      <div
        className="navbar bg-base-300 shadow-lg flex"
      >
        <h1
          className="text-xl font-bold"
        >
          {title}
        </h1>
        <div
          className="flex gap-1 ml-auto"
        >
          {
            AppTitle === title && (
              <>
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost btn-circle p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>

                  </div>
                  <ul
                    tabIndex={-1}
                    className="menu dropdown-content bg-base-200 rounded-box z-1 mt-4 w-52 p-2 shadow-sm"
                  >
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "0d")}>All Time Fun Facts</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "7d")}>Last 7 days</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "30d")}>Last 30 days</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "60d")}>Last 60 days</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "90d")}>Last 90 days</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "6mo")}>Last 6 months</button></li>
                    <li><button className="btn btn-ghost text-lg text-left" onClick={(e) => statRangeLookbackSelected(e, "12mo")}>Last 12 months</button></li>
                  </ul>
                </div>
                <button
                  className="btn btn-ghost p-1"
                  onClick={
                    () => emailModalRef.current?.showModal()
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
              </>
            )
          }
        </div>
      </div>
      <dialog
        ref={emailModalRef}
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-backdrop bg-base-300"></div>
        <div
          className="modal-box"
        >
          <h3
            className="font-bold text-lg"
          >
            Enter email to load & save games...
          </h3>
          <p
            className="py-4"
          >
            <input
              type="text"
              placeholder="Enter email address..."
              className="input w-full"
              value={emailOnModal}
              onChange={
                (e) => setEmailOnModal(e.target.value)
              }
            />
          </p>
          <div
            className="modal-action"
          >
            <form
              method="dialog"
            >
              {/* if there is a button in form, it will close the modal */}
              <button
                className="btn btn-secondary"
                onClick={
                  async () => await saveEmail(emailOnModal)
                }
              >
                Save
              </button>
              <button
                className="btn btn-secondary btn-outline ml-3"
                onClick={
                  () => setEmailOnModal(emailForCloudApi)
                }
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <div
        className="p-4"
      >
        <HashRouter>
          <Routes>
            <Route
              path='/'
              element={
                <Home
                  leaderboardData={
                    getLeaderboard(filteredGameResults)
                  }
                  setTitle={setTitle}
                  generalFacts={
                    getGeneralFacts(filteredGameResults)
                  }
                  goOutsLeaderboardData={
                    getGoOutsPerGameLeaderboard(filteredGameResults)
                  }
                  highestSingleHandScoreLeaderboardData={
                    getHighestSingleHandScoreLeaderboard(filteredGameResults)
                  }
                  gameDurationData={
                    getAverageGameDurationsByPlayerCount(filteredGameResults)
                  }
                  gamesByMonthData={
                    getGamesByMonth(filteredGameResults)
                  }
                  allGames={
                    getGameHistoryData(filteredGameResults)
                  }
                  addNewGameResult={addNewGameResult}
                  emailForSaving={emailForCloudApi}
                  lowestScoreAllTimeData={
                    getLowestScoreAllTimeData(filteredGameResults)
                  }
                  gamesPlayedTrendChartData={
                    getGamesPlayedTrendChartData(filteredGameResults)
                  }
                  scoreDistributionData={
                    getScoreDistributionData(filteredGameResults)
                  }
                  avgScoreLeaderboardData={
                    getAvgScoreLeaderboard(filteredGameResults)
                  }
                  statRangeLookback={statRangeLookback}
                />
              }
            />
            <Route
              path='/setup'
              element={
                <Setup
                  setTitle={setTitle}
                  previousPlayers={getPreviousPlayers(gameResults)}
                  setCurrentPlayers={setCurrentPlayers}
                />
              }
            />
            <Route
              path='/play'
              element={
                <Play
                  addNewGameResult={addNewGameResult}
                  setTitle={setTitle}
                  currentPlayers={currentPlayers}
                  emailForSaving={emailForCloudApi}
                  saveEmail={saveEmail}
                />
              }
            />
          </Routes>
        </HashRouter>
      </div>
    </div>
  )
}

export default App
