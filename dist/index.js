#!/usr/bin/env node
import{existsSync as Y,promises as Te}from"fs";import z from"path";import ne from"path";import{createMatchPath as ze}from"tsconfig-paths";async function $(t,e){return ze(e.absoluteBaseUrl,e.paths)(t,void 0,()=>!0,[".ts",".tsx"])}import{cosmiconfig as Ke}from"cosmiconfig";import{loadConfig as Be}from"tsconfig-paths";import{z as u}from"zod";var ie="@/components",se="@/lib/utils",ae="app/globals.css",ce="tailwind.config.js";var Me=Ke("components",{searchPlaces:["components.json"]}),j=u.object({$schema:u.string().optional(),style:u.string(),rsc:u.coerce.boolean().default(!1),tsx:u.coerce.boolean().default(!0),tailwind:u.object({config:u.string(),css:u.string(),baseColor:u.string(),cssVariables:u.boolean().default(!0),prefix:u.string().default("").optional()}),aliases:u.object({components:u.string(),utils:u.string(),ui:u.string().optional()})}).strict(),Ve=j.extend({resolvedPaths:u.object({tailwindConfig:u.string(),tailwindCss:u.string(),utils:u.string(),components:u.string(),ui:u.string()})});async function w(t){let e=await Je(t);return e?await T(t,e):null}async function T(t,e){let o=await Be(t);if(o.resultType==="failed")throw new Error(`Failed to load ${e.tsx?"tsconfig":"jsconfig"}.json. ${o.message??""}`.trim());return Ve.parse({...e,resolvedPaths:{tailwindConfig:ne.resolve(t,e.tailwind.config),tailwindCss:ne.resolve(t,e.tailwind.css),utils:await $(e.aliases.utils,o),components:await $(e.aliases.components,o),ui:e.aliases.ui?await $(e.aliases.ui,o):await $(e.aliases.components,o)}})}async function Je(t){try{let e=await Me.search(t);return e?j.parse(e.config):null}catch{throw new Error(`Invalid configuration found in ${t}/components.json.`)}}import{detect as Ge}from"@antfu/ni";async function L(t){let e=await Ge({programmatic:!0,cwd:t});return e==="yarn@berry"?"yarn":e==="pnpm@6"?"pnpm":e==="bun"?"bun":e??"npm"}import F from"chalk";var p={error(...t){console.log(F.red(...t))},warn(...t){console.log(F.yellow(...t))},info(...t){console.log(F.cyan(...t))},success(...t){console.log(F.green(...t))},break(){console.log("")}};function S(t){typeof t=="string"&&(p.error(t),process.exit(1)),t instanceof Error&&(p.error(t.message),process.exit(1)),p.error("Something went wrong. Please try again."),process.exit(1)}import Ye from"path";import{z as c}from"zod";var le=c.object({name:c.string(),dependencies:c.array(c.string()).optional(),devDependencies:c.array(c.string()).optional(),registryDependencies:c.array(c.string()).optional(),files:c.array(c.string()),type:c.enum(["components:ui","components:component","components:example"])}),pe=c.array(le),He=le.extend({files:c.array(c.object({name:c.string(),content:c.string()}))}),me=c.array(He),fe=c.array(c.object({name:c.string(),label:c.string()})),de=c.object({inlineColors:c.object({light:c.record(c.string(),c.string()),dark:c.record(c.string(),c.string())}),cssVars:c.object({light:c.record(c.string(),c.string()),dark:c.record(c.string(),c.string())}),inlineColorsTemplate:c.string(),cssVarsTemplate:c.string()});import{HttpsProxyAgent as qe}from"https-proxy-agent";import Xe from"node-fetch";var ge=process.env.COMPONENTS_REGISTRY_URL??"https://ui.shadcn.com",Ze=process.env.https_proxy?new qe(process.env.https_proxy):void 0;async function N(){try{let[t]=await _(["index.json"]);return pe.parse(t)}catch{throw new Error("Failed to fetch components from registry.")}}async function V(){try{let[t]=await _(["styles/index.json"]);return fe.parse(t)}catch{throw new Error("Failed to fetch styles from registry.")}}async function J(){return[{name:"slate",label:"Slate"},{name:"gray",label:"Gray"},{name:"zinc",label:"Zinc"},{name:"neutral",label:"Neutral"},{name:"stone",label:"Stone"}]}async function b(t){try{let[e]=await _([`colors/${t}.json`]);return de.parse(e)}catch{throw new Error("Failed to fetch base color from registry.")}}async function G(t,e){let o=[];for(let r of e){let n=t.find(i=>i.name===r);if(n&&(o.push(n),n.registryDependencies)){let i=await G(t,n.registryDependencies);o.push(...i)}}return o.filter((r,n,i)=>i.findIndex(s=>s.name===r.name)===n)}async function O(t,e){try{let o=e.map(n=>`styles/${t}/${n.name}.json`),r=await _(o);return me.parse(r)}catch{throw new Error("Failed to fetch tree from registry.")}}async function W(t,e,o){if(o)return o;if(e.type==="components:ui"&&t.aliases.ui)return t.resolvedPaths.ui;let[r,n]=e.type.split(":");return r in t.resolvedPaths?Ye.join(t.resolvedPaths[r],n):null}async function _(t){try{return await Promise.all(t.map(async o=>await(await Xe(`${ge}/registry/${o}`,{agent:Ze})).json()))}catch(e){throw console.log(e),new Error(`Failed to fetch registry from ${ge}.`)}}import{promises as at}from"fs";import{tmpdir as ct}from"os";import ve from"path";import{SyntaxKind as Qe}from"ts-morph";var ue=async({sourceFile:t,config:e,baseColor:o})=>(e.tailwind?.cssVariables||!o?.inlineColors||t.getDescendantsOfKind(Qe.StringLiteral).forEach(r=>{let n=r.getText();if(n){let i=tt(n.replace(/"/g,""),o.inlineColors);r.replaceWithText(`"${i.trim()}"`)}}),t);function H(t){if(!t.includes("/")&&!t.includes(":"))return[null,t,null];let e=[],[o,r]=t.split("/");if(!o.includes(":"))return[null,o,r];let n=o.split(":"),i=n.pop(),s=n.join(":");return e.push(s??null,i??null,r??null),e}var et=["bg-","text-","border-","ring-offset-","ring-"];function tt(t,e){t.includes(" border ")&&(t=t.replace(" border "," border border-border "));let o=t.split(" "),r=new Set,n=new Set;for(let i of o){let[s,m,f]=H(i),h=et.find(a=>m?.startsWith(a));if(!h){r.has(i)||r.add(i);continue}let l=m?.replace(h,"");if(l&&l in e.light){r.add([s,`${h}${e.light[l]}`].filter(Boolean).join(":")+(f?`/${f}`:"")),n.add(["dark",s,`${h}${e.dark[l]}`].filter(Boolean).join(":")+(f?`/${f}`:""));continue}r.has(i)||r.add(i)}return[...Array.from(r),...Array.from(n)].join(" ").trim()}var he=async({sourceFile:t,config:e})=>{let o=t.getImportDeclarations();for(let r of o){let n=r.getModuleSpecifierValue();n.startsWith("@/registry/")&&(e.aliases.ui?r.setModuleSpecifier(n.replace(/^@\/registry\/[^/]+\/ui/,e.aliases.ui)):r.setModuleSpecifier(n.replace(/^@\/registry\/[^/]+/,e.aliases.components))),n=="@/lib/utils"&&r.getNamedImports().find(m=>m.getName()==="cn")&&r.setModuleSpecifier(n.replace(/^@\/lib\/utils/,e.aliases.utils))}return t};import{transformFromAstSync as rt}from"@babel/core";import{parse as ot}from"@babel/parser";import nt from"@babel/plugin-transform-typescript";import*as R from"recast";var it={sourceType:"module",allowImportExportEverywhere:!0,allowReturnOutsideFunction:!0,startLine:1,tokens:!0,plugins:["asyncGenerators","bigInt","classPrivateMethods","classPrivateProperties","classProperties","classStaticBlock","decimal","decorators-legacy","doExpressions","dynamicImport","exportDefaultFrom","exportNamespaceFrom","functionBind","functionSent","importAssertions","importMeta","nullishCoalescingOperator","numericSeparator","objectRestSpread","optionalCatchBinding","optionalChaining",["pipelineOperator",{proposal:"minimal"}],["recordAndTuple",{syntaxType:"hash"}],"throwExpressions","topLevelAwait","v8intrinsic","typescript","jsx"]},xe=async({sourceFile:t,config:e})=>{let o=t.getFullText();if(e.tsx)return o;let r=R.parse(o,{parser:{parse:i=>ot(i,it)}}),n=rt(r,o,{cloneInputAst:!1,code:!1,ast:!0,plugins:[nt],configFile:!1});if(!n||!n.ast)throw new Error("Failed to transform JSX");return R.print(n.ast).code};import{SyntaxKind as st}from"ts-morph";var ye=async({sourceFile:t,config:e})=>{if(e.rsc)return t;let o=t.getFirstChildByKind(st.ExpressionStatement);return o?.getText()==='"use client"'&&o.remove(),t};import{Project as lt,ScriptKind as pt}from"ts-morph";import{SyntaxKind as g}from"ts-morph";var we=async({sourceFile:t,config:e})=>(e.tailwind?.prefix&&(t.getDescendantsOfKind(g.CallExpression).filter(o=>o.getExpression().getText()==="cva").forEach(o=>{if(o.getArguments()[0]?.isKind(g.StringLiteral)){let r=o.getArguments()[0];r&&r.replaceWithText(`"${x(r.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)}o.getArguments()[1]?.isKind(g.ObjectLiteralExpression)&&o.getArguments()[1]?.getDescendantsOfKind(g.PropertyAssignment).find(r=>r.getName()==="variants")?.getDescendantsOfKind(g.PropertyAssignment).forEach(r=>{r.getDescendantsOfKind(g.PropertyAssignment).forEach(n=>{let i=n.getInitializerIfKind(g.StringLiteral);i&&i?.replaceWithText(`"${x(i.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)})})}),t.getDescendantsOfKind(g.JsxAttribute).forEach(o=>{if(o.getName()==="className"){if(o.getInitializer()?.isKind(g.StringLiteral)){let r=o.getInitializer();r&&r.replaceWithText(`"${x(r.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)}if(o.getInitializer()?.isKind(g.JsxExpression)){let r=o.getInitializer()?.getDescendantsOfKind(g.CallExpression).find(n=>n.getExpression().getText()==="cn");r&&r.getArguments().forEach(n=>{(n.isKind(g.ConditionalExpression)||n.isKind(g.BinaryExpression))&&n.getChildrenOfKind(g.StringLiteral).forEach(i=>{i.replaceWithText(`"${x(i.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)}),n.isKind(g.StringLiteral)&&n.replaceWithText(`"${x(n.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)})}}o.getName()==="classNames"&&o.getInitializer()?.isKind(g.JsxExpression)&&o.getDescendantsOfKind(g.PropertyAssignment).forEach(r=>{if(r.getInitializer()?.isKind(g.CallExpression)){let n=r.getInitializerIfKind(g.CallExpression);n&&n.getArguments().forEach(i=>{i.isKind(g.ConditionalExpression)&&i.getChildrenOfKind(g.StringLiteral).forEach(s=>{s.replaceWithText(`"${x(s.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)}),i.isKind(g.StringLiteral)&&i.replaceWithText(`"${x(i.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)})}if(r.getInitializer()?.isKind(g.StringLiteral)&&r.getName()!=="variant"){let n=r.getInitializer();n&&n.replaceWithText(`"${x(n.getText()?.replace(/"/g,""),e.tailwind.prefix)}"`)}})})),t);function x(t,e=""){let o=t.split(" "),r=[];for(let n of o){let[i,s,m]=H(n);i?m?r.push(`${i}:${e}${s}/${m}`):r.push(`${i}:${e}${s}`):m?r.push(`${e}${s}/${m}`):r.push(`${e}${s}`)}return r.join(" ")}function Ce(t,e){let o=t.split(`
`);for(let r of o)if(r.includes("@apply")){let n=r.replace("@apply","").trim(),i=x(n,e);t=t.replace(n,i)}return t}var mt=[he,ye,ue,we],ft=new lt({compilerOptions:{}});async function dt(t){let e=await at.mkdtemp(ve.join(ct(),"shadcn-"));return ve.join(e,t)}async function U(t){let e=await dt(t.filename),o=ft.createSourceFile(e,t.raw,{scriptKind:pt.TSX});for(let r of mt)r({sourceFile:o,...t});return await xe({sourceFile:o,...t})}import Se from"chalk";import{Command as gt}from"commander";import{execa as be}from"execa";import ut from"ora";import q from"prompts";import{z as C}from"zod";var ht=C.object({components:C.array(C.string()).optional(),yes:C.boolean(),overwrite:C.boolean(),cwd:C.string(),all:C.boolean(),path:C.string().optional()}),Ie=new gt().name("add").description("add a component to your project").argument("[components...]","the components to add").option("-y, --yes","skip confirmation prompt.",!0).option("-o, --overwrite","overwrite existing files.",!1).option("-c, --cwd <cwd>","the working directory. defaults to the current directory.",process.cwd()).option("-a, --all","add all available components",!1).option("-p, --path <path>","the path to add the component to.").action(async(t,e)=>{try{let o=ht.parse({components:t,...e}),r=z.resolve(o.cwd);Y(r)||(p.error(`The path ${r} does not exist. Please try again.`),process.exit(1));let n=await w(r);n||(p.warn(`Configuration is missing. Please run ${Se.green("init")} to create a components.json file.`),process.exit(1));let i=await N(),s=o.all?i.map(a=>a.name):o.components;if(!o.components?.length&&!o.all){let{components:a}=await q({type:"multiselect",name:"components",message:"Which components would you like to add?",hint:"Space to select. A to toggle all. Enter to submit.",instructions:!1,choices:i.map(d=>({title:d.name,value:d.name,selected:o.all?!0:o.components?.includes(d.name)}))});s=a}s?.length||(p.warn("No components selected. Exiting."),process.exit(0));let m=await G(i,s),f=await O(n.style,m),h=await b(n.tailwind.baseColor);if(f.length||(p.warn("Selected components not found. Exiting."),process.exit(0)),!o.yes){let{proceed:a}=await q({type:"confirm",name:"proceed",message:"Ready to install components and dependencies. Proceed?",initial:!0});a||process.exit(0)}let l=ut("Installing components...").start();for(let a of f){l.text=`Installing ${a.name}...`;let d=await W(n,a,o.path?z.resolve(r,o.path):void 0);if(!d)continue;if(Y(d)||await Te.mkdir(d,{recursive:!0}),a.files.filter(v=>Y(z.resolve(d,v.name))).length&&!o.overwrite)if(s.includes(a.name)){l.stop();let{overwrite:v}=await q({type:"confirm",name:"overwrite",message:`Component ${a.name} already exists. Would you like to overwrite?`,initial:!1});if(!v){p.info(`Skipped ${a.name}. To overwrite, run with the ${Se.green("--overwrite")} flag.`);continue}l.start(`Installing ${a.name}...`)}else continue;for(let v of a.files){let P=z.resolve(d,v.name),Ue=await U({filename:v.name,raw:v.content,config:n,baseColor:h});n.tsx||(P=P.replace(/\.tsx$/,".jsx"),P=P.replace(/\.ts$/,".js")),await Te.writeFile(P,Ue)}let k=await L(r);a.dependencies?.length&&await be(k,[k==="npm"?"install":"add",...a.dependencies],{cwd:r}),a.devDependencies?.length&&await be(k,[k==="npm"?"install":"add","-D",...a.devDependencies],{cwd:r})}l.succeed("Done.")}catch(o){S(o)}});import{existsSync as X,promises as xt}from"fs";import Z from"path";import A from"chalk";import{Command as yt}from"commander";import{diffLines as wt}from"diff";import{z as D}from"zod";var Ct=D.object({component:D.string().optional(),yes:D.boolean(),cwd:D.string(),path:D.string().optional()}),Pe=new yt().name("diff").description("check for updates against the registry").argument("[component]","the component name").option("-y, --yes","skip confirmation prompt.",!1).option("-c, --cwd <cwd>","the working directory. defaults to the current directory.",process.cwd()).action(async(t,e)=>{try{let o=Ct.parse({component:t,...e}),r=Z.resolve(o.cwd);X(r)||(p.error(`The path ${r} does not exist. Please try again.`),process.exit(1));let n=await w(r);n||(p.warn(`Configuration is missing. Please run ${A.green("init")} to create a components.json file.`),process.exit(1));let i=await N();if(!o.component){let f=n.resolvedPaths.components,h=i.filter(a=>{for(let d of a.files){let y=Z.resolve(f,d);if(X(y))return!0}return!1}),l=[];for(let a of h){let d=await Ee(a,n);d.length&&l.push({name:a.name,changes:d})}l.length||(p.info("No updates found."),process.exit(0)),p.info("The following components have updates available:");for(let a of l){p.info(`- ${a.name}`);for(let d of a.changes)p.info(`  - ${d.filePath}`)}p.break(),p.info(`Run ${A.green("diff <component>")} to see the changes.`),process.exit(0)}let s=i.find(f=>f.name===o.component);s||(p.error(`The component ${A.green(o.component)} does not exist.`),process.exit(1));let m=await Ee(s,n);m.length||(p.info(`No updates found for ${o.component}.`),process.exit(0));for(let f of m)p.info(`- ${f.filePath}`),await vt(f.patch),p.info("")}catch(o){S(o)}});async function Ee(t,e){let o=await O(e.style,[t]),r=await b(e.tailwind.baseColor),n=[];for(let i of o){let s=await W(e,i);if(s)for(let m of i.files){let f=Z.resolve(s,m.name);if(!X(f))continue;let h=await xt.readFile(f,"utf8"),l=await U({filename:m.name,raw:m.content,config:e,baseColor:r}),a=wt(l,h);a.length>1&&n.push({file:m.name,filePath:f,patch:a})}}return n}async function vt(t){t.forEach(e=>{if(e)return e.added?process.stdout.write(A.green(e.value)):e.removed?process.stdout.write(A.red(e.value)):process.stdout.write(e.value)})}import{existsSync as We,promises as I}from"fs";import E from"path";import K from"path";import ee from"fast-glob";import Q,{pathExists as Tt}from"fs-extra";import{loadConfig as St}from"tsconfig-paths";var te=["**/node_modules/**",".next","public","dist","build"];async function $e(t){let e=await w(t);if(e)return e;let o=await bt(t),r=await It(t),n=await Et(t);if(!o||!r||!n)return null;let i=await Pt(t),s={$schema:"https://ui.shadcn.com/schema.json",rsc:["next-app","next-app-src"].includes(o),tsx:i,style:"new-york",tailwind:{config:i?"tailwind.config.ts":"tailwind.config.js",baseColor:"zinc",css:r,cssVariables:!0,prefix:""},aliases:{utils:`${n}/lib/utils`,components:`${n}/components`}};return await T(t,s)}async function bt(t){if(!(await ee.glob("**/*",{cwd:t,deep:3,ignore:te})).find(i=>i.startsWith("next.config.")))return null;let r=await Q.pathExists(K.resolve(t,"src"));return await Q.pathExists(K.resolve(t,`${r?"src/":""}app`))?r?"next-app-src":"next-app":r?"next-pages-src":"next-pages"}async function It(t){let e=await ee.glob("**/*.css",{cwd:t,deep:3,ignore:te});if(!e.length)return null;for(let o of e)if((await Q.readFile(K.resolve(t,o),"utf8")).includes("@tailwind base"))return o;return null}async function Et(t){let e=await St(t);if(e?.resultType==="failed"||!e?.paths)return null;for(let[o,r]of Object.entries(e.paths))if(r.includes("./*")||r.includes("./src/*"))return o.at(0);return null}async function Pt(t){return Tt(K.resolve(t,"tsconfig.json"))}async function je(t){if(!(await ee.glob("tailwind.config.*",{cwd:t,deep:3,ignore:te})).length)throw new Error("Tailwind CSS is not installed. Visit https://tailwindcss.com/docs/installation to get started.");return!0}var De=`import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,Ae=`import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
`,ke=`/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{<%- extension %>,<%- extension %>x}',
    './components/**/*.{<%- extension %>,<%- extension %>x}',
    './app/**/*.{<%- extension %>,<%- extension %>x}',
    './src/**/*.{<%- extension %>,<%- extension %>x}',
  ],
  prefix: "<%- prefix %>",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`,Le=`/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{<%- extension %>,<%- extension %>x}',
    './components/**/*.{<%- extension %>,<%- extension %>x}',
    './app/**/*.{<%- extension %>,<%- extension %>x}',
    './src/**/*.{<%- extension %>,<%- extension %>x}',
  ],
  prefix: "<%- prefix %>",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`,Fe=`import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{<%- extension %>,<%- extension %>x}',
    './components/**/*.{<%- extension %>,<%- extension %>x}',
    './app/**/*.{<%- extension %>,<%- extension %>x}',
    './src/**/*.{<%- extension %>,<%- extension %>x}',
  ],
  prefix: "<%- prefix %>",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config`,Ne=`import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{<%- extension %>,<%- extension %>x}',
    './components/**/*.{<%- extension %>,<%- extension %>x}',
    './app/**/*.{<%- extension %>,<%- extension %>x}',
    './src/**/*.{<%- extension %>,<%- extension %>x}',
	],
  prefix: "<%- prefix %>",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config`;import oe from"chalk";import{Command as jt}from"commander";import{execa as Dt}from"execa";import At from"lodash.template";import M from"ora";import re from"prompts";import{z as B}from"zod";var kt=["tailwindcss-animate","class-variance-authority","clsx","tailwind-merge"],Lt=B.object({cwd:B.string(),yes:B.boolean(),defaults:B.boolean()}),_e=new jt().name("init").description("initialize your project and install dependencies").option("-y, --yes","skip confirmation prompt.",!1).option("-d, --defaults,","use default configuration.",!1).option("-c, --cwd <cwd>","the working directory. defaults to the current directory.",process.cwd()).action(async t=>{try{let e=Lt.parse(t),o=E.resolve(e.cwd);We(o)||(p.error(`The path ${o} does not exist. Please try again.`),process.exit(1)),je(o);let r=await $e(o);if(r){let n=await Nt(o,r,t.defaults);await Oe(o,n)}else{let n=await w(o),i=await Ft(o,n,e.yes);await Oe(o,i)}p.info(""),p.info(`${oe.green("Success!")} Project initialization completed. You may now add components.`),p.info("")}catch(e){S(e)}});async function Ft(t,e=null,o=!1){let r=l=>oe.cyan(l),n=await V(),i=await J(),s=await re([{type:"toggle",name:"typescript",message:`Would you like to use ${r("TypeScript")} (recommended)?`,initial:e?.tsx??!0,active:"yes",inactive:"no"},{type:"select",name:"style",message:`Which ${r("style")} would you like to use?`,choices:n.map(l=>({title:l.label,value:l.name}))},{type:"select",name:"tailwindBaseColor",message:`Which color would you like to use as ${r("base color")}?`,choices:i.map(l=>({title:l.label,value:l.name}))},{type:"text",name:"tailwindCss",message:`Where is your ${r("global CSS")} file?`,initial:e?.tailwind.css??ae},{type:"toggle",name:"tailwindCssVariables",message:`Would you like to use ${r("CSS variables")} for colors?`,initial:e?.tailwind.cssVariables??!0,active:"yes",inactive:"no"},{type:"text",name:"tailwindPrefix",message:`Are you using a custom ${r("tailwind prefix eg. tw-")}? (Leave blank if not)`,initial:""},{type:"text",name:"tailwindConfig",message:`Where is your ${r("tailwind.config.js")} located?`,initial:e?.tailwind.config??ce},{type:"text",name:"components",message:`Configure the import alias for ${r("components")}:`,initial:e?.aliases.components??ie},{type:"text",name:"utils",message:`Configure the import alias for ${r("utils")}:`,initial:e?.aliases.utils??se},{type:"toggle",name:"rsc",message:`Are you using ${r("React Server Components")}?`,initial:e?.rsc??!0,active:"yes",inactive:"no"}]),m=j.parse({$schema:"https://ui.shadcn.com/schema.json",style:s.style,tailwind:{config:s.tailwindConfig,css:s.tailwindCss,baseColor:s.tailwindBaseColor,cssVariables:s.tailwindCssVariables,prefix:s.tailwindPrefix},rsc:s.rsc,tsx:s.typescript,aliases:{utils:s.utils,components:s.components}});if(!o){let{proceed:l}=await re({type:"confirm",name:"proceed",message:`Write configuration to ${r("components.json")}. Proceed?`,initial:!0});l||process.exit(0)}p.info("");let f=M("Writing components.json...").start(),h=E.resolve(t,"components.json");return await I.writeFile(h,JSON.stringify(m,null,2),"utf8"),f.succeed(),await T(t,m)}async function Nt(t,e,o=!1){let r=l=>oe.cyan(l),n=e.style,i=e.tailwind.baseColor,s=e.tailwind.cssVariables;if(!o){let l=await V(),a=await J(),d=await re([{type:"select",name:"style",message:`Which ${r("style")} would you like to use?`,choices:l.map(y=>({title:y.label,value:y.name}))},{type:"select",name:"tailwindBaseColor",message:`Which color would you like to use as ${r("base color")}?`,choices:a.map(y=>({title:y.label,value:y.name}))},{type:"toggle",name:"tailwindCssVariables",message:`Would you like to use ${r("CSS variables")} for colors?`,initial:e?.tailwind.cssVariables,active:"yes",inactive:"no"}]);n=d.style,i=d.tailwindBaseColor,s=d.tailwindCssVariables}let m=j.parse({$schema:e?.$schema,style:n,tailwind:{...e?.tailwind,baseColor:i,cssVariables:s},rsc:e?.rsc,tsx:e?.tsx,aliases:e?.aliases});p.info("");let f=M("Writing components.json...").start(),h=E.resolve(t,"components.json");return await I.writeFile(h,JSON.stringify(m,null,2),"utf8"),f.succeed(),await T(t,m)}async function Oe(t,e){let o=M("Initializing project...")?.start();for(let[l,a]of Object.entries(e.resolvedPaths)){let d=E.extname(a)?E.dirname(a):a;l==="utils"&&a.endsWith("/utils")&&(d=d.replace(/\/utils$/,"")),We(d)||await I.mkdir(d,{recursive:!0})}let r=e.tsx?"ts":"js",n=E.extname(e.resolvedPaths.tailwindConfig),i;n===".ts"?i=e.tailwind.cssVariables?Ne:Fe:i=e.tailwind.cssVariables?Le:ke,await I.writeFile(e.resolvedPaths.tailwindConfig,At(i)({extension:r,prefix:e.tailwind.prefix}),"utf8");let s=await b(e.tailwind.baseColor);s&&await I.writeFile(e.resolvedPaths.tailwindCss,e.tailwind.cssVariables?e.tailwind.prefix?Ce(s.cssVarsTemplate,e.tailwind.prefix):s.cssVarsTemplate:s.inlineColorsTemplate,"utf8"),await I.writeFile(`${e.resolvedPaths.utils}.${r}`,r==="ts"?De:Ae,"utf8"),o?.succeed();let m=M("Installing dependencies...")?.start(),f=await L(t),h=[...kt,e.style==="new-york"?"@radix-ui/react-icons":"lucide-react"];await Dt(f,[f==="npm"?"install":"add",...h],{cwd:t}),m?.succeed()}import{Command as _t}from"commander";import Ot from"path";import Wt from"fs-extra";function Re(){let t=Ot.join("package.json");return Wt.readJSONSync(t)}process.on("SIGINT",()=>process.exit(0));process.on("SIGTERM",()=>process.exit(0));async function Rt(){let t=await Re(),e=new _t().name("shadcn-ui").description("add components and dependencies to your project").version(t.version||"1.0.0","-v, --version","display the version number");e.addCommand(_e).addCommand(Ie).addCommand(Pe),e.parse()}Rt();
//# sourceMappingURL=index.js.map