package org.techy.xo_clash.events;

public enum PowerUp {
    EXTRA_MOVE("Extra Move"),
    BLOCK_CELL("Block Cell"),
    UNDO_MOVE("Undo Move"),
    SWAP_CELL("Swap Cell"),
    HINT("Hint"),
    GHOST_MOVE("Ghost Move");

    private String name;
    PowerUp(String name) {
        this.name = name;
    }
}
