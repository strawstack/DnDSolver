function solver() {

    // Constants
    const ROWS = 9;
    const COLS = 9;

    const EMPTY = "";
    const CHEST = "C";
    const MONSTER = "M";

    const DOM = true;
    const LOG = false;

    // Element refs
    const grid_ref = document.querySelectorAll(".cell");
    const circle_ref = document.querySelector(".circle");
    const solveBtn_ref = document.querySelector(".solveBtn");

    grid_ref.forEach((e, i) => e.dataset.index = i);

    const getCellRef = ({x, y}) => {
        return grid_ref[COLS * y + x];
    };

    const coordFromIndex = index => {
        return {
            x: index % COLS,
            y: Math.floor(index / COLS)
        };
    };

    const hash = ({x, y}) => {
        return JSON.stringify({x, y});
    };

    const saveData = (pos, value) => {
        const dataStr = window.localStorage.getItem("data");
        let data = {};
        if (dataStr !== null) data = JSON.parse(dataStr);
        data[hash({x: pos.x, y: pos.y})] = { pos, value };
        window.localStorage.setItem(
            "data",
            JSON.stringify(data)
        );
    };

    const eq = (a, b) => {
        return a.x === b.x && a.y === b.y;
    };

    const add = (a, b) => {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    };

    const sub = (a, b) => {
        return {
            x: a.x - b.x,
            y: a.y - b.y
        };
    };

    const mag = v => {
        return Math.sqrt( Math.pow(v.x, 2) + Math.pow(v.y, 2) );
    };

    const setCircle = (startPos, radius) => {
        const { x, y } = startPos;
        circle_ref.style.left = `${x - radius}px`;
        circle_ref.style.top = `${y - radius}px`;
        circle_ref.style.width = `${2 * radius}px`;
        circle_ref.style.height = `${2 * radius}px`;
    };

    const showCircle = isVisible => {
        circle_ref.style.display = isVisible ? 'inline-block' : 'none';
    };

    const setCursorPointer = isPointer => {
        document.body.style.cursor = isPointer ? 'pointer' : 'default';
    };

    const distanceToNumber = distance => {
        const segment = 700 / 9;
        return Math.min(9, Math.floor(distance / segment));
    };

    const numberListeners = () => {

        let selection = null;

        const registerCell = ({x, y}) => {
            const cell_ref = getCellRef({x, y});
            cell_ref.innerHTML = 0;
            cell_ref.addEventListener("mousedown", e => {
                const { target, clientX, clientY } = e;
                const startPos = {x: clientX, y: clientY};
                selection = {
                    startPos,
                    target
                };
                setCircle(startPos, 0);
                showCircle(true);
                setCursorPointer(true);
            });
        };

        for (let i = 1; i < ROWS; i++) {
            registerCell({x: 0, y: i});
        }

        for (let i = 1; i < COLS; i++) {
            registerCell({x: i, y: 0});
        }

        document.body.addEventListener("mousemove", e => {
            if (selection !== null) {
                const { clientX, clientY } = e;
                const { startPos, target } = selection;
                const currentPos = {x: clientX, y: clientY};
                const distance = mag(sub(currentPos, startPos));
                setCircle(startPos, distance);
                target.innerHTML = distanceToNumber(distance);
            }
        });

        document.body.addEventListener("mouseup", e => {
            if (selection !== null) {

                const pos = coordFromIndex(selection.target.dataset.index);
                saveData(pos, selection.target.innerHTML);

                selection = null;
                showCircle(false);
                setCursorPointer(false);
            }
        });

    };
    numberListeners();

    const placeListeners = () => {
        const cycle_lookup = {
            [EMPTY]: MONSTER,
            [MONSTER]: CHEST,
            [CHEST]: EMPTY
        };

        const registerCell = ({x, y}) => {
            getCellRef({x, y}).addEventListener("click", e => {
                const { target: t } = e;
                t.innerHTML = cycle_lookup[t.innerHTML];
                saveData({x, y}, t.innerHTML);
            });
        };

        for (let y = 1; y < ROWS; y++) {
            for (let x = 1; x < COLS; x++) {
                registerCell({x, y});
            }
        }

    };
    placeListeners();

    const getRowNumbers = () => {
        const lst = [];
        for (let i = 1; i < ROWS; i++) {
            lst.push(
                parseInt(getCellRef({x: 0, y: i}).innerHTML, 10)
            );
        }
        return lst;
    };

    const getColNumbers = () => {
        const lst = [];
        for (let i = 1; i < COLS; i++) {
            lst.push(
                parseInt(getCellRef({x: i, y: 0}).innerHTML, 10)
            );
        }
        return lst;
    };

    const getItemPositions = label => {
        const lst = [];
        for (let y = 1; y < ROWS; y++) {
            for (let x = 1; x < COLS; x++) {
                if (getCellRef({x, y}).innerHTML === label) {
                    lst.push({x: x - 1, y: y - 1});
                }
            }
        }
        return lst;
    };

    const getData = () => {
        const row_nums = getRowNumbers();
        const col_nums = getColNumbers();
        const monster_pos_lookup = makeLookup(getItemPositions(MONSTER));
        const chest_pos = getItemPositions(CHEST)[0];
        const chest_pos_lookup = makeLookup([chest_pos]);
        return {
            row_nums,
            col_nums,
            chest_pos,
            chest_pos_lookup,
            monster_pos_lookup
        };
    };

    const allZero = lst => {
        for (let value of lst) {
            if (value !== 0) return false;
        }
        return true;
    };

    const inBounds = ({x, y}) => {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    };

    const chestInRoomWithDoor = (chest_offset_lookup, wall_lookup) => {

        const hasWallsAndDoor = (current_outer, wall_lookup) => {
            let hasDoor = false;
            for (let off of current_outer) {
                if (!(hash(off) in wall_lookup) && inBounds(off)) {
                    if (hasDoor) {
                        return false;
    
                    } else {
                        hasDoor = true;
    
                    }
                }
            }
            return hasDoor;
        };

        const topRight = Object.values(chest_offset_lookup).reduce((a, c) => {
            if (a.x === c.x) {
                if (a.y < c.y) return a;
                return c;

            } else {
                if (a.x < c.x) return a;
                return c;
            }
        });

        // Offsets given topRight cell
        const outer = [
            {x: 0, y: -1},
            {x: 1, y: -1},
            {x: 2, y: -1},

            {x: 3, y: 0},
            {x: 3, y: 1},
            {x: 3, y: 2},

            {x: 0, y: 3},
            {x: 1, y: 3},
            {x: 2, y: 3},

            {x: -1, y: 0},
            {x: -1, y: 1},
            {x: -1, y: 2}
        ];
        const current_outer = outer.map(x => add(x, topRight));

        const wallsAndDoor = hasWallsAndDoor(current_outer, wall_lookup);
        return wallsAndDoor;
    };

    const monsterInDeadEnd = (monster_pos_lookup, wall_lookup) => {
        const offsets = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        for (let monster_hash in monster_pos_lookup) {
            const monster_pos = monster_pos_lookup[monster_hash];

            let count = 0;
            for (let off of offsets) {
                const pos = add(monster_pos, off);
                if (hash(pos) in wall_lookup || !inBounds(pos)) count += 1;
            }

            if (count !== 3) return false;
        }

        return true;
    };

    const deadEndHasMonster = (monster_pos_lookup, wall_lookup) => {
        const offsets = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {

                if (hash({x, y}) in wall_lookup) continue;

                let count = 0;
                for (let off of offsets) {
                    const pos = add({x, y}, off);
                    if (hash(pos) in wall_lookup || !inBounds(pos)) count += 1;
                }

                if (count === 3 && !(hash({x, y}) in monster_pos_lookup)) return false;
            }
        }

        return true;
    };

    const dfs = (start, wall_lookup) => {

        const offsets = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        const seen = {};
        const stack = [start];
        while (stack.length > 0) {

            const pos = stack.pop();
            const hh = hash(pos);

            if (hh in seen) continue;
            seen[hh] = true;

            for (let off of offsets) {

                const nx = add(off, pos);
                const hash_nx = hash(nx);

                if (!inBounds(nx) || hash_nx in wall_lookup) continue;
                if (hash_nx in seen) continue;

                stack.push(nx);

            }
        }

        return Object.keys(seen).length;
    };

    const emptySpaceContigious = (chest_pos_lookup, wall_lookup) => {
        const empty_count = 8 * 8 - Object.keys(wall_lookup).length;

        // chest_pos is always not a wall, so start DFS there
        const fill_count = dfs(Object.values(chest_pos_lookup)[0], wall_lookup);

        return empty_count === fill_count;
    };

    const noTwoByTwoSpace = (chest_offset_lookup, wall_lookup) => {
        const offsets = [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 1}
        ];
        for (let y = 0; y < 8 - 1; y++) {
            for (let x = 0; x < 8 - 1; x++) {

                let count = 0;
                for (let off of offsets) {

                    const pos = add({x, y}, off);
                    const hh = hash(pos);

                    if (hh in chest_offset_lookup) break;
                    if (!(hh in wall_lookup)) count += 1;

                }
                if (count === 4) return false;
            }
        }
        return true;
    };

    const makeLookup = lst => {
        const lookup = {};
        for (let w of lst) {
            lookup[hash(w)] = w;
        }
        return lookup;
    };

    const valid = (monster_pos_lookup, chest_pos_lookup, chest_offset_lookup, wall_lookup) => {

        // 1: Chest in 3x3 room with one door.
        const c1 = chestInRoomWithDoor(chest_offset_lookup, wall_lookup);
        if (!c1) return false;

        // 2: Every monster in dead end.
        const c2 = monsterInDeadEnd(monster_pos_lookup, wall_lookup);
        if (!c2) return false;

        // 3: Every dead end contains monster.
        const c3 = deadEndHasMonster(monster_pos_lookup, wall_lookup);
        if (!c3) return false;

        // 4: All empty space is contigious.
        const c4 = emptySpaceContigious(chest_pos_lookup, wall_lookup);
        if (!c4) return false;

        // 5: Outside treasure room, never 2x2 space.
        const c6 = noTwoByTwoSpace(chest_offset_lookup, wall_lookup);
        if (!c6) return false;

        // TODO 9: For any cell placed, ensure that it does not close off a region
        // of the map. Better than solving ahead a knowing that solution
        // can never work.

        return true;
    };

    const nextPos = pos => {
        const cpos = {...pos};
        cpos.x += 1;
        if (cpos.x === 8) {
            cpos.y += 1;
            cpos.x = 0;
        }
        return cpos;
    };

    const prevPos = pos => {
        const cpos = {...pos};
        cpos.x -= 1;
        if (cpos.x === -1) {
            cpos.y -= 1;
            cpos.x = 7;
        }
        return cpos;
    };

    let prevFocus = null;
    let prevBackground = null;

    const nestedSol = ({ row_nums, col_nums, monster_pos_lookup, chest_pos_lookup, pos: {x: px, y: py}, wall_lookup, chest_offset_lookup }) => {

        if (DOM) {
            if (
                hash({x: 5, y: 0}) in wall_lookup &&
                hash({x: 6, y: 0}) in wall_lookup &&
                hash({x: 7, y: 0}) in wall_lookup &&

                hash({x: 1, y: 1}) in wall_lookup &&
                hash({x: 3, y: 1}) in wall_lookup &&

                hash({x: 1, y: 2}) in wall_lookup &&
                hash({x: 3, y: 2}) in wall_lookup &&

                hash({x: 5, y: 2}) in wall_lookup &&
                hash({x: 6, y: 2}) in wall_lookup &&
                hash({x: 7, y: 2}) in wall_lookup &&

                hash({x: 1, y: 3}) in wall_lookup &&
                hash({x: 2, y: 3}) in wall_lookup &&
                hash({x: 3, y: 3}) in wall_lookup &&

                hash({x: 3, y: 4}) in wall_lookup &&

                hash({x: 5, y: 4}) in wall_lookup &&
                hash({x: 6, y: 4}) in wall_lookup &&
                hash({x: 7, y: 4}) in wall_lookup &&

                hash({x: 3, y: 5}) in wall_lookup &&

                hash({x: 3, y: 6}) in wall_lookup &&

                hash({x: 5, y: 6}) in wall_lookup &&
                hash({x: 6, y: 6}) in wall_lookup &&
                hash({x: 7, y: 6}) in wall_lookup &&

                hash({x: 0, y: 7}) in wall_lookup &&
                hash({x: 1, y: 7}) in wall_lookup &&
                hash({x: 2, y: 7}) in wall_lookup &&
                hash({x: 3, y: 7}) in wall_lookup &&

                true
            ) debugger;
        }

        // Base condition
        if (allZero(row_nums) && allZero(col_nums)) {
            if (LOG) console.log(`allZero(row_nums) && allZero(col_nums)`);
            const v = valid(monster_pos_lookup, chest_pos_lookup, chest_offset_lookup, wall_lookup);
            if (LOG && !v) console.log(`valid(monster_pos_lookup, chest_pos_lookup, wall_lookup)`);
            if (v) {
                return wall_lookup;
            }
        }

        // Guard condition
        if (py === 8) {
            if (LOG) console.log(`py === 8`);
            return false
        };

        if (DOM) {
            if (prevFocus !== null) getCellRef(prevFocus).style.background = prevBackground;
            prevFocus = {x: px + 1, y: py + 1};
            const cellRef = getCellRef({x: px + 1, y: py + 1});
            prevBackground = cellRef.style.background;
            cellRef.style.background = "lightblue";
        };

        // If not enough rows left to satisfy column count
        if (8 - py < col_nums[px]) {
            if (LOG) console.log(`8 - py < col_nums[px]`);
            return false
        };

        // If not enough cols left to satisfy row count
        if (8 - px < row_nums[py]) {
            if (LOG) console.log(`8 - px < row_nums[py]`);
            return false
        };

        // Verify that 2x2 region previous
        // is not an open space outside the treasure room.
        if (py >= 1 && px >= 2) {
            const prev_cells = [
                {x: px - 1, y: py},
                {x: px - 2, y: py},
                {x: px - 1, y: py - 1},
                {x: px - 2, y: py - 1}
            ];

            const spaceFound = () => {
                for (let pos of prev_cells) {
                    const hh = hash(pos);
                    if (hh in chest_offset_lookup) return false;
                    if (hh in wall_lookup) return false;
                }
                return true;
            };
            if (spaceFound()) {
                if (LOG) console.log(`spaceFound()`);
                return false;
            };
        }

        // If you place a wall in the cell below a monster,
        // fail if monster is boxed in or has two or more exits.
        if (py >= 1 && (py !== 1 || px !== 0)) { // <- brackets make sure you're not specifically at row 1 col 0
            const prev_pos = prevPos({x: px, y: py});
            const ch = hash({x: prev_pos.x, y: prev_pos.y - 1});
            if (ch in monster_pos_lookup) {
                const special_monster_pos_lookup = {[ch]: {x: prev_pos.x, y: prev_pos.y - 1}};
                if (!monsterInDeadEnd(special_monster_pos_lookup, wall_lookup)) {
                    if (LOG) console.log(`!monsterInDeadEnd(special_monster_pos_lookup, wall_lookup)`);
                    return false;
                };
            }
        }

        const hh = hash({x: px, y: py});

        // Place a wall if possible and recurse
        const c1 = row_nums[py] > 0;
        const c2 = col_nums[px] > 0;
        const c3 = !(hh in monster_pos_lookup);
        const c4 = !(hh in chest_offset_lookup);
        if (LOG) {
            if (!c1) console.log(`row_nums[py] > 0`);
            if (!c2) console.log(`col_nums[px] > 0`);
            if (!c3) console.log(`!(hh in monster_pos_lookup)`);
            if (!c4) console.log(`!(hh in chest_offset_lookup)`);
        }
        if (c1 && c2 && c3 && c4) {

            wall_lookup[hash({x: px, y: py})] = {x: px, y: py};
            row_nums[py] -= 1;
            col_nums[px] -= 1;

            if (DOM) getCellRef({x: px + 1, y: py + 1}).innerHTML = "W";

            // TODO: If you're placing a wall under the bottom right corner of the
            // chest_offset_lookup, you can eval the chest room at this point

            const answer = nestedSol({
                row_nums,
                col_nums,
                monster_pos_lookup,
                chest_pos_lookup,
                pos: nextPos({x: px, y: py}),
                wall_lookup,
                chest_offset_lookup
            });

            if (answer !== false) {
                if (LOG) console.log(`answer !== false`);
                return answer;
            }

            delete wall_lookup[hash({x: px, y: py})];
            row_nums[py] += 1;
            col_nums[px] += 1;

            if (DOM) getCellRef({x: px + 1, y: py + 1}).innerHTML = "";

        }

        // Try not placing a wall in the current cell
        const answer = nestedSol({
            row_nums,
            col_nums,
            monster_pos_lookup,
            chest_pos_lookup,
            pos: nextPos({x: px, y: py}),
            wall_lookup,
            chest_offset_lookup
        });

        return answer;
    };

    let prevOffsets = null;

    const sol = () => {
        const {
            row_nums,
            col_nums,
            chest_pos,
            chest_pos_lookup,
            monster_pos_lookup
        } = getData();

        const offsets = [
            {x: -1, y: -1},
            {x: 0, y: -1},
            {x: 1, y: -1},

            {x: -1, y: 0},
            {x: 0, y: 0},
            {x: 1, y: 0},

            {x: -1, y: 1},
            {x: 0, y: 1},
            {x: 1, y: 1}
        ];
        const chest_offsets = offsets.map(off => add(chest_pos, off));
        for (let shift of offsets) {
            const current_offsets = chest_offsets.map(off => add(shift, off));

            // All chest cells must be in bounds
            if (!current_offsets.every(pos => inBounds(pos))) continue;

            if (DOM) {
                if (prevOffsets !== null) {
                    for (let off of prevOffsets) {
                        getCellRef(add(off, {x: 1, y: 1})).style.background = 'white';
                    }
                }
                for (let off of current_offsets) {
                    getCellRef(add(off, {x: 1, y: 1})).style.background = 'lightgoldenrodyellow';
                }
                prevOffsets = [...current_offsets];
            }

            const answer = nestedSol({
                row_nums,
                col_nums,
                monster_pos_lookup,
                chest_pos_lookup,
                pos: {x: 0, y: 0},
                wall_lookup: {}, // track wall positions
                chest_offset_lookup: makeLookup(current_offsets)
            });

            if (answer !== false) {
                console.log(answer);
                return;
            }
        }
        console.log(false); // No answer possible
    };

    const init = () => {
        // Load localStorage
        const dataStr = window.localStorage.getItem("data");
        if (dataStr !== null) {
            const data = JSON.parse(dataStr);
            for (let key in data) {
                const { pos, value } = data[key];
                getCellRef({x: pos.x, y: pos.y}).innerHTML = value;
            }
        }
    };
    init();

    solveBtn_ref.addEventListener("click", sol);
}
solver();