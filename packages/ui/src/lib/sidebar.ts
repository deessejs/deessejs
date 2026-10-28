/**
 * The cookie the sidebar's open state is written in.
 *
 * The name lives in a module of its own, without the `"use client"`
 * directive, because the component that writes the cookie is a client
 * module. A server component that imports a client module receives a
 * client reference rather than the value: the React server runtime
 * answers every named export with a proxy around a function that
 * throws when it is called, and a constant read from one is that
 * proxy rather than the string. The failure is silent, so the
 * preference would simply never apply.
 *
 * The lifetime of the cookie is the component's business and stays
 * there.
 */
export const SIDEBAR_COOKIE_NAME = "sidebar_state"
