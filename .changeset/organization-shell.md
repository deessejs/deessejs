---
"app": minor
"@workspace/ui": minor
"@workspace/auth": minor
---

Adds the workspace shell: the rail, the organization switcher, the organization's navigation and the account menu.

The workspace is navigable now. The rail names the organization the page belongs to, lists the organization's own pages under it, and carries the account menu at the bottom. The switcher lists the organizations the caller belongs to, marks the one the page is on, and choosing another one writes the session's active selection and lands the caller in that organization's workspace.

The selection stays the caller's choice. Nothing in a page view writes it, so opening another organization's page directly shows that organization while the session keeps pointing at the first one, until the caller switches explicitly through the rail. `/home` resolves to the session's selection, so the two can disagree, and the rail is the only thing that settles it.

The switcher creates an organization too, through the same dialog the empty state uses. The list refreshes itself after a creation, because the creation goes through the API and not through the plugin's own endpoint, so the plugin's invalidation never fires.

A switch the server refuses, and a switch that never reaches the server, are shown with the same words: the organization could not be selected. The browser cannot tell them apart, and a rail that blamed the caller for the server's absence would be lying.

The rail's open state survives a reload. The sidebar writes it in a cookie and never read it back, so the layout reads the cookie and hands the value to the sidebar, and the preference applies from the first paint.

The rail's header is the height of the page's own header and carries the same separator, so the two read as one line across the window. The navigation is centred on the vertical axis, and the three parts of the rail carry the page's background, so the rail reads as part of the page rather than as a surface of its own.

`packages/ui` gains the cookie's name in a module of its own, without the `"use client"` directive, and declares it in the package's exports map. A server component cannot read a constant out of a client module: the React server runtime answers every named export with a proxy around a function that throws when it is called, so the lookup would silently find nothing and the preference would never apply.

The account settings keep their own rail. The two navigations cover two scopes, on two surfaces, and the workspace's navigation stays organization-scoped.

The empty state becomes an organizations page. `/organizations` lists every organization the caller belongs to, with a search field, a create action and a grid of cards, and the caller picks one from it. It replaces `/no-organization`, which named what the page was for rather than what it shows. The reserved slug set moves with it: `organizations` is the application's own segment now, and the application owns the URL.

The account menu names the account. Its trigger shows the avatar, the name and the email, and the menu repeats the identity at its head before the entries. The menu is mounted in the rail's footer and in the header of the surfaces that have no rail, so the identity is hidden on a narrow viewport, where the header has no room for it. The menu itself always names the account.
