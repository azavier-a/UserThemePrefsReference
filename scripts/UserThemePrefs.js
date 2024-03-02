
 /* UserThemePrefs Class Declaration */

/** This is a library created to handle groups of user preferences.
 * 
 * Specifically, this library type thing can make & save modifications to `:root` element CSS variables.
 * 
 * Putting a property in a given array has a different effect:
 * - `all` - the rule applies to all pages
 * - `dashboard` - the rule applies to the dashboard
 * - `timers` - the rule applies to the timers page
 * - `todo` - the rule applies to the todo page
 * - `calendar` - the rule applies to the calendar page
 * 
 * Example creation of a UTP instance to handle a `:root` element on the `timers` page:
 * ```JS
 *    const UTP = new UserThemePrefs("example", {
 *       timers: [
 *          "variable1",
 *          "variable2",
 *          "variable3"
 *       ]
 *    });
 * ```
 * * It is important to note that a single UTP instance can handle properties on multiple pages.
 *  You can use all of the pref arrays if you wanted to. Try not to go overboard, it'll be okay
 * 
 * Now, pushing user preferences is as easy as calling {@link PushRuleset}(...ruleset) with all of the rules we wish to push. `Rule` in this context refers to a CSS rule:
 * ```CSS
 *    property: value;
 * ```
 * UTP can parse rules so long as the property you are trying to override is a member of the UTP instance.
 * 
 * Example pushing a set of rules for UTP to parse:
 * ```JS
 *    EXAMPLE_PREFS.PushRuleset(
 *       ["variable1", "#000000"],
 *       ["variable2", "2"],
 *       ["variable3", "100%"]
 *    );
 * ```
 * After doing this, UTP will override all properties which are a member of itself with the provided values. 
 * 
 * To load the data of UTP instance members (for updating), call {@link LoadData}(). This is done automatically when you call {@link PushRuleset}(...ruleset).
 * 
 * To delete all user preferences stored by a UTP instance, call {@link DeleteData}().
 * 
 * I don't know if it works because I havent tried, but you should be able to add
 * new pages to this system relatively easily by doing the following:
 *  1. Add it's page index to it's HTML file if it doesnt exist (see the other pages for example, it's at the top).
 * > * Page indices MUST be continuous. If you're adding the 5th page, you cant give it "page_index" 10.
 *  2. Add an entry for it in the constructor object parameter, as well as in the 'this.prefs' declaration.
 *  
 *  It's important to note that the 'all' array will be applied to any webpage which links this script.
 *  You don't have to do anything special if you just want your new page to be compatible with pre-existing master themes.
 */
class UserThemePrefs {
    static #page_index = document.querySelector("meta[name='page_index']").content;
    /** A list of all UTP instances is useful for two main reasons:
     * - Loading all UTP instance data is much simpler.
     * - Deleting all UTP instance data is much simpler. (allows us to reset theme preferences for the whole webpage)
     * 
     * All new UTP instances are Global by default, meaning they exist in this array. 
     * 
     * To make a UTP instance Local (remove it from the array), add the following call after you instantiate your UTP:
     * ```JS
     *    const EXAMPLE_PREFS = new UserThemePrefs("example", { ... });
     *    > UserThemePrefs.MakeLocal(EXAMPLE_PREFS);
     * ```
     * Local UTP instances are not affected by the Global UTP functions.
     */
    static #GlobalUTPs = [];

    /**
     * @param {String} id - Each instance of a UTP should have a unique ID.
     * @param {Object} pref - An element of pref should be an array with property names [p, p, p, ... ]
     * @namespace UserThemePrefs 
     */
    constructor (id, {all, reference, tutorial, examples}) {
        this.prefs = [all, reference, tutorial, examples];
        // The order of this.prefs array is based on page_index
        // 0 is no page, so that's where 'all' is placed.
        // 1=dashboard  2=timers  3=todo  4=calendar
        this.id = `user-theme-prefs-${id}`;

        UserThemePrefs.MakeGlobal(this);
        // Attempt to load data for this UTP
        this.LoadData();
    }

     /* UserThemePrefs Function Declarations */

     /* - Helper Functions - */

    /**
     * @param {String} id - The id of the element to remove from the head.
     * @returns {Boolean} True if it was removed, false if it didn't exist.
     */
    static #DeleteFromDocumentHead(id) {
        const node = document.getElementById(id) ?? 0;
        if(node === 0) return false;
    
        document.head.removeChild(node);
        return true;
    }

    /** 
     * @param {String} property
     * @returns {Boolean} True if the property is a member of this UTP instance.
     */
    hasProperty(property) {
        for(const PAGE in this.prefs) {
            const rules = this.prefs[PAGE] ?? 0;
            if(rules === 0) continue;

            for(const KEY of rules) {
                if(KEY == property) return true;
            }
        }
        return false;
    }

     /* - UTP Core Functions - */

    /** Returns all user-defined preferences for the variable group.
     * 
     * This means there must be data in `localStorage` which is associated with this UTP instance for anything to be returned.
     * @returns {Object} {property, value, page} ruleset as a 2D array [ {p,v,p}, {p,v,p}, {p,v,p}, ... ]
     */
    QueryRuleset() {
        const ruleset = [];
        // If a key (property) has an associated value in storage, it is pushed into the ruleset.
        for(const PAGE in this.prefs) {
            for(const property of this.prefs[PAGE] ?? []) {
                const value = localStorage.getItem(property) ?? 0;
                // Prevent pushing data that doesn't exist.
                if(value === 0) continue;

                ruleset.push({
                    property: property,
                    value: value,
                    page: PAGE
                });
            } 
        }
        return ruleset;
    }

    /** Pushes a rule(set) into this UTP instance.
     * 
     * Example use:
     * ```JS
     *    NAV_PREFS.PushRuleset( 
     *       ["nav-width", "100px"],
     *       ["name-bubble-col", "#000000"]
     *    );
     * ```
     * This would make the navbar 100px wide and make the name bubble black when we're on the dashboard.
     * 
     * If you have a `ruleset` (an array of rules), you can call this function using the spread `...` operator:
     * ```JS
     *    UTP.PushRuleset(...ruleset);
     * ```
     * @param  {...Array} ruleset - Array of [property, value] elements.
     * @returns {Boolean} True if at least one rule was set.
     */
    PushRuleset(...ruleset) {
        if(ruleset.length == 0) return false;

        let ret = false;
        for(const rule of ruleset) {
            if(!this.hasProperty(rule[0])) continue;

            ret = true;
            localStorage.setItem(...rule);
        }
        this.LoadData();

        return ret;
    }

    /** Attempts to load the data for members of this UTP instance if they need to be loaded.
     * 
     * If successful and there is data to load, a `style` element for this UTP instance is created.
     * 
     * Logic Diagram for Loading Rules:
     * ```Text
     *                Is the rule for all pages?
     *                /                    \
     *              Yes                    No
     *               |                      |   
     *         Apply the rule       Are we on that page?
     *                               /              \
     *                             Yes              No
     *                              |                |
     *                        Apply the rule    Skip the rule
     * ```
     * @returns {Boolean} True if any data was loaded from `localStorage`.
     */
    LoadData() {
        // If we're not on a page which this UTP can have data for, don't try to load it.
        if((this.prefs[0]??0 + this.prefs[UserThemePrefs.#page_index]??0) === 0) return false;
        // Delete the old userprefs style element if it exists.
        const SE = UserThemePrefs.#DeleteFromDocumentHead(this.id);
        const ruleset = this.QueryRuleset();
        // if there is no data for this object, don't make a style
        if(ruleset.length == 0) return SE; // If there was a style but now there is no data, deleting the style was a successful load.

        // Create a new style element
        const UTPS = document.createElement("style");
        UTPS.id = this.id;

        // Build a new root selector ruleset
        UTPS.innerHTML = ":root {\n";
        for(const rule of ruleset) {
            if(rule.page != 0 && rule.page != UserThemePrefs.#page_index) continue;

            UTPS.innerHTML += `--${rule.property}: ${rule.value};\n`;
        }
        UTPS.innerHTML+= "}";

        // Add the new style element to the page head.
        document.head.appendChild(UTPS);
        return true;
    }

    /** Removes `localStorage` data for every property in this UTP instance if it exists.
     * 
     * Also deletes the `style` element belonging to this UTP instance if it exists.
     * @returns {Boolean} True if any data was cleared from `localStorage`.
     */
    DeleteData() {
        const SE = UserThemePrefs.#DeleteFromDocumentHead(this.id);
        const ruleset = this.QueryRuleset();
        // if there is no data for this object, don't make a style
        if(ruleset.length == 0) return SE; // If there was a style but now there is no data, deleting the style was a successful delete.

        for(const rule of ruleset) {
            localStorage.removeItem(rule.property);
        }
        return true;
    }

     /* - Global UTP Functions - */

    /** Adds a UTP instance to the GlobalUTPs list. This allows the Global UTP functions to affect it.
     * @param {UserThemePrefs} UTP - Instance of {@link UserThemePrefs}
     * @returns {Boolean} True if the UTP instance was local and made global.
     */
    static MakeGlobal(UTP) {
        const GA = this.#GlobalUTPs;
        if(GA.indexOf(UTP) != -1) return false;
        GA.push(UTP);
        return true;
    }

    /** Removes a UTP instance from the GlobalUTPs list. This prevents the Global UTP functions from affecting it.
     *  
     * You probably shouldn't do this unless you really know what it does.
     * @param {UserThemePrefs} UTP - Instance of {@link UserThemePrefs}
     * @returns {Boolean} True if the UTP instance was global and made local.
     */
    static MakeLocal(UTP) {
        const GA = this.#GlobalUTPs, ind = GA.indexOf(UTP);
        if(ind == -1) return false;
        GA.splice(ind, 1);
        return true;
    }

    /** Tries to push a ruleset into all Global UTP instances.
     * 
     * Uhh don't call this function without the spread `...` operator. If you manage to pass a reference,
     * all rules that are pushed will be removed from that array. This is intentional to make this function faster.
     * @param  {Array} ruleset - Array of [property, value] elements.
     * @returns {Boolean} True if at least one rule was set.
     */
    static GlobalPushRuleset(...ruleset) {
        let ret = false;
        for(const UTP of this.#GlobalUTPs) {
            if(!UTP.PushRuleset(...ruleset)) continue;

            ret = true;
            for(let rule_index = 0; rule_index < ruleset.length; rule_index++) {
                if(!UTP.hasProperty(ruleset[rule_index][0])) continue;

                
                ruleset.splice(rule_index, 1);
                rule_index--;
            }
            if(ruleset.length == 0) return true;
        } 
        return ret;
    }

    /** Tries to load data for all Global UTP instances. 
     * 
     * If applicable, they will each have their own `style` element embedded in the `head` element.
     * 
     * Call this if you want to preload all entries, or update all of them for whatever reason.
     * 
     * - If you use this for importing, make SURE you call it right after you make changes to `localStorage`. 
     *    Unexpected interactions may occur if you ignore this.
     * @returns {Boolean} True if any data was loaded from `localStorage`.
     */
    static GlobalLoadData() { 
        let ret = false;
        for(const UTP of this.#GlobalUTPs) if(UTP.LoadData()) ret = true; 
        return ret;
    }

    /** Deletes all values associated with properties of Global UTP instances in `localStorage`. 
     * 
     * Also deletes their `style` elements.
     * 
     * `Clear global preferences` is a good descriptor of this action.
     * @returns {Boolean} True if any data was cleared from `localStorage`.
     */
    static GlobalDeleteData() {
        let ret = false;
        for(const UTP of this.#GlobalUTPs) if(UTP.DeleteData()) ret = true; 
        return ret;
    }
}


 /* Preference Variable Group Declarations || PLEASE declare all UTP instances here. */


/** Variable group instance for the reference quicknav */
const WEBPAGE_PREFS = new UserThemePrefs("maser", {
    all: [
        "nav-bg-col",
        "nav-text-col",
        "nav-link-hover",
        "nav-height",
        "main-bg-col",
        "settings-width"
    ]
});

const QUICKNAV_PREFS = new UserThemePrefs("reference-quicknav", {
    reference: [
        "ref-quicknav-width",
        
        "ref-quicknav-bg",
        "ref-quicknav-hover-bg",
        "ref-quicknav-active-bg",
        "ref-quicknav-unfolded-bg",

        "ref-quicknav-text",
        "ref-quicknav-hover-text",
        "ref-quicknav-active-text",
        "ref-quicknav-unfolded-text"
    ]
});

const REFERENCE_PREFS = new UserThemePrefs("reference", {
    reference: [
        "ref-content-gutter-width",
        "ref-content-gutter-bg",
        "ref-content-gutter-border-width",
        "ref-content-gutter-border-col"
    ]
})

const FIND = (th, p) => {
    for(const R of th) if(R.property == p) return R;

    return 0;
};
const MERGE = (A, B) => {
    for(const a of A) {
        const N = FIND(B, a[0]);
        if(N === 0) continue;

        a[1] = N.value;
    }
}
const DEFAULT_THEME = [
    // all.css
    ["nav-bg-col", "rgb(206, 213, 146)"],
    ["nav-text-col", "rgba(12, 38, 72, 0.9)"],
    ["nav-link-hover", "rgba(12, 38, 72, 0.75)"],
    ["nav-height", "5%"],
    ["main-bg-col", "rgb(255, 252, 212)"],
    ["settings-width", "15em"],
    
    // reference.css
    ["ref-quicknav-width", "9.6em"],
    ["ref-quicknav-bg", "rgb(206, 213, 146)"],
    ["ref-quicknav-hover-bg", "var(--main-bg-col)"],
    ["ref-quicknav-active-bg", "rgb(47, 175, 68)"],
    ["ref-quicknav-unfolded-bg", "var(--main-bg-col)"],
    ["ref-quicknav-text", "var(--nav-text-col)"],
    ["ref-quicknav-hover-text", "var(--nav-link-hover)"],
    ["ref-quicknav-active-text", "var(--nav-link-hover)"],
    ["ref-quicknav-unfolded-text", "var(--nav-link-hover)"],

    ["ref-content-gutter-bg", "var(--main-bg-col)"],
    ["ref-content-gutter-width", "8em"],
    ["ref-content-gutter-border-width", "2px"],
    ["ref-content-gutter-border-col", "var(--nav-bg-col)"]
];