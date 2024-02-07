function solver() {
    
    // Constants
    const ROWS = 9;
    const COLS = 9;
    // const CELL_SIZE = 80; // Estimated based on fixed container size and number of rows/cols

    // Container dimensions
    // const {left: containerLeft, top: containerTop} = document.querySelector(".container").getBoundingClientRect();
    
    // Element refs
    const grid_ref = document.querySelectorAll(".cell");
    const circle_ref = document.querySelector(".circle");
    
    const getCellRef = ({x, y}) => {
        return grid_ref[COLS * y + x];
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
             
                selection = null;
                showCircle(false);
                setCursorPointer(false);
            }
        });

    };
    numberListeners();
    

}
solver();