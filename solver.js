function solver() {

    // Constants
    const ROWS = 9;
    const COLS = 9;

    const EMPTY = "";
    const CHEST = "C";
    const MONSTER = "M";

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

    const checkRoom = (current_offsets, wall_lookup) => {
        for (let off of current_offsets) {
            if (!inBounds(off) || hash(off) in wall_lookup) return false;
        }
        return true;
    };

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

    const chestInRoomWithSize = (chest_pos, wall_lookup) => {
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

        const outer = [
            {x: -1, y: -2},
            {x: 0, y: -2},
            {x: 1, y: -2},

            {x: -2, y: -1},
            {x: 2, y: -1},

            {x: -2, y: 0},
            {x: 2, y: 0},

            {x: -2, y: 1},
            {x: 2, y: 1},

            {x: -1, y: 2},
            {x: 0, y: 2},
            {x: 1, y: 2}
        ].map(off => add(chest_pos, off));

        // Shift the room around the chest location until a match is found
        for (let shift of offsets) {
            const current_offsets = chest_offsets.map(off => add(shift, off));
            const current_outer = outer.map(out => add(shift, out));

            const emptyRoom = checkRoom(current_offsets, wall_lookup);
            if (!emptyRoom) continue;

            const wallsAndDoor = hasWallsAndDoor(current_outer, wall_lookup);
            if (wallsAndDoor) {
                return {
                    check: true,
                    chest_room: current_offsets
                };
            };

        }

        return { check: false, chest_room: null };
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

    const emptySpaceContigious = (chest_pos, wall_lookup) => {
        const empty_count = 8 * 8 - Object.keys(wall_lookup).length;

        // chest_pos is always not a wall, so start DFS there
        const fill_count = dfs(chest_pos, wall_lookup);

        return empty_count === fill_count;
    };

    const hallwayOneSpaceWide = wall_lookup => {
        return true;
    };

    const noTwoByTwoSpace = (chest_room, wall_lookup) => {
        const chest_room_lookup = makeLookup(chest_room);
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

                    if (hh in chest_room_lookup) break;
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

    const valid = (monster_pos, chest_pos, walls) => {

        const wall_lookup = makeLookup(walls);

        // 1: Chest in 3x3 room with one door.
        const { check: c1, chest_room } = chestInRoomWithSize(chest_pos, wall_lookup);
        if (!c1) return false;

        // 2: Every monster in dead end.
        const c2 = monsterInDeadEnd(monster_pos, wall_lookup);
        if (!c2) return false;

        // 3: Every dead end contains monster.
        const c3 = deadEndHasMonster(monster_pos, wall_lookup);
        if (!c3) return false;

        // 4: All empty space is contigious.
        const c4 = emptySpaceContigious(chest_pos, wall_lookup);
        if (!c4) return false;

        // 5: Hallways one space wide.
        const c5 = hallwayOneSpaceWide(wall_lookup);
        if (!c5) return false;

        // 6: Outside treasure room, never 2x2 space.
        const c6 = noTwoByTwoSpace(chest_room, wall_lookup);
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

    const nestedSol = ({ row_nums, col_nums, monster_pos_lookup, chest_pos_lookup, pos: {x: px, y: py}, walls, chest_offset_lookup }) => {

        debugger

        // Base condition
        if (allZero(row_nums) && allZero(col_nums)) {
            if (valid(monster_pos_lookup, chest_pos_lookup, walls)) {
                return walls;
            }
        }

        // Guard condition
        if (py === 8) return false;

        // If not enough rows left to satisfy column count
        if (8 - py < col_nums[px]) return false;

        // If not enough cols left to satisfy row count
        if (8 - px < row_nums[py]) return false;

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
                    if (walls.filter(coord => eq(coord, pos)).length > 0) return false;
                }
                return true;
            };
            if (spaceFound()) return false;
        }

        // If you place a wall in the cell below a monster,
        // fail if monster is boxed in or has two exits.
        if (py >= 1 && px >= 1) {
            const prev_pos = {x: px - 1, y: py};
            if (walls.filter(coord => eq(coord, prev_pos)).length > 0) {
                const ch = hash({x: px - 1, y: py - 1});
                if (ch in monster_pos_lookup) {
                    const special_monster_pos_lookup = {[ch]: true};
                    if (!monsterInDeadEnd(special_monster_pos_lookup, makeLookup(walls))) return false;
                }
            }
        }

        const hh = hash({x: px, y: py});

        // Place a wall if possible and recurse
        if (
            row_nums[py] > 0 &&
            col_nums[px] > 0 &&
            !(hh in monster_pos_lookup) &&
            !(hh in chest_offset_lookup)
        ) {

            walls.push({x: px, y: py});
            row_nums[py] -= 1;
            col_nums[px] -= 1;

            getCellRef({x: px + 1, y: py + 1}).innerHTML = "W";

            // TODO: If you're placing a wall under the bottom right corner of the
            // chest_offset_lookup, you can eval the chest room at this point

            const answer = nestedSol({
                row_nums,
                col_nums,
                monster_pos_lookup,
                chest_pos_lookup,
                pos: nextPos({x: px, y: py}),
                walls,
                chest_offset_lookup
            });

            if (answer !== false) {
                return answer;
            }

            walls.pop();
            row_nums[py] += 1;
            col_nums[px] += 1;

            getCellRef({x: px + 1, y: py + 1}).innerHTML = "";

        }

        // Try not placing a wall in the current cell
        const answer = nestedSol({
            row_nums,
            col_nums,
            monster_pos_lookup,
            chest_pos_lookup,
            pos: nextPos({x: px, y: py}),
            walls,
            chest_offset_lookup
        });

        return answer;
    };

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

            const answer = nestedSol({
                row_nums,
                col_nums,
                monster_pos_lookup,
                chest_pos_lookup,
                pos: {x: 0, y: 0},
                walls: [], // track wall positions
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