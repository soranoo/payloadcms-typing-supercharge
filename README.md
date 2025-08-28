# PayloadCMS-Typing-Supercharge

Project starts on 18-05-2025

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![npm version](https://img.shields.io/npm/v/payloadcms-typing-supercharge?color=red&style=flat)](https://www.npmjs.com/package/payloadcms-typing-supercharge) [![npm downloads](https://img.shields.io/npm/dt/payloadcms-typing-supercharge?color=blue&style=flat)](https://www.npmjs.com/package/payloadcms-typing-supercharge)&nbsp;&nbsp;&nbsp;[![Donation](https://img.shields.io/static/v1?label=Donation&message=❤️&style=social)](https://github.com/soranoo/Donation)

This package provides strongly typed [PayloadCMS](https://payloadcms.com/) types, enhancing the type safety and validation of your PayloadCMS queries and operations. It allows you to perform type-safe selections, where clauses, sort operations, and CRUD operations with strong type inference.

Give me a ⭐ if you like it.

## 🤔 Why this?

[PayloadCMS](https://payloadcms.com/) is a great headless CMS, but its default types can be enhanced to provide better type safety and validation. This package supercharges PayloadCMS with:

- Strong type inference for nested queries
- Type-safe field selections
- Enhanced type safety for CRUD operations

IMHO, Payload claims to be type-safe, but not strong as I expected (ton of `any`...) Give me a ⭐ if you agree :p

## 🗝️ Features

- ✨ **Type Safety Selection**: Type-safe selecting up to any specified depth, not more `string | {collection-object}` at the same time.
- 🎯 **Where Clause Type Safety**: Enhanced type checking for query filters
- 📊 **Sort Type Safety**: Type-safe sorting operations with dot notation support
- 🚀 **CRUD Operation Type Safety**: Support the following operations:
  - `find`
  - `findByID`
  - `create`
  - `update` (byID and Bulk)
  - `delete` (byID and Bulk)
- 🔍 **Type-Safe Types**: Support the following type:
  - `AccessResult`
  - `Access`
  - `FilterOptionsFunc`
  - `FilterOptions`
  - `Sort`
  - `Where`

> [!CAUTION]\
> ALL operations under `TypedPayload` are rootless by default, meaning `overrideAccess = false`.

> [!NOTE]\
> If you want to use root access by default, you can set `overrideAccess = true` in the constructor of `TypedPayload` class. eg. `const typedPayload = new TypedPayload(payload, { overrideAccess: true });`

## 📦 Requirements

- PayloadCMS >= 3.0.0
- TypeScript >= 5.0.0

## 🚀 Getting Started

### Installation

Install the package using npm:

```bash
npm install payloadcms-typing-supercharge
```

Then you can use the CLI to generate types.

>[!TIP]\
>Read [CLI](#-cli) for more information on using the command line interface.

### Usage 🎉

1. First, import the `TypedPayload` class:

    ```typescript
    import { TypedPayload } from 'payloadcms-typing-supercharge';
    ```

2. Create a type-safe PayloadCMS instance:

    ```typescript
    const typedPayload = TypedPayload.createTypedPayload(payload);
    ```

3. Enjoy type-safe operations! Here are some examples:

#### Type Safe Selection

```typescript
interface Profile { // Sample Collection Type
  id: string;
  name: string;
  subProfile: Profile;
}
interface User { // Sample Collection Type
  id: string;
  name: string;
  profile: Profile;
}

const result = await typedPayload.find({
  collection: 'users',
  depth: 2,
});

result.profile // ✅ Type: Profile, current depth 0
result.profile.subProfile // ✅ Type: Profile, current depth 1
result.profile.subProfile.subProfile // ✅ Type: string (ID),  current depth 2
result.profile.subProfile.subProfile.subProfile // ❌ Invalid, depth exceeded, current depth 3
```

#### Type-Safe Query Operation

```typescript
interface Profile { // Sample Collection Type
  id: string;
  name: string;
  subProfile: Profile;
}
interface User { // Sample Collection Type
  id: string;
  name: string;
  profile: Profile;
}

await typedPayload.find({
  collection: 'users',
  where: {
    "profile.subProfile.name": { // ✅ Valid selection
      equals: 'John Doe'
    }
  },
});

await typedPayload.find({
  collection: 'users',
  where: {
    "profile.subProfile.firstName": { // ❌ Invalid selection, `firstName` does not exist
      equals: 'John Doe'
    }
  },
});
```

#### Type-Safe Sort Operation

```typescript
interface Profile { // Sample Collection Type
  id: string;
  name: string;
  subProfile: Profile;
}
interface User { // Sample Collection Type
  id: string;
  name: string;
  profile: Profile;
}

await typedPayload.find({
  collection: 'users',
  sort: ['name', '-profile.subProfile.name'], // ✅ Valid sort
});

await typedPayload.find({
  collection: 'users',
  sort: [
    '+name', // ❌ Invalid sortting operator, `+` is not allowed
    '-profile.subProfile.firstName' // ❌ Invalid sort, `firstName` does not exist
    ], 
});
```

#### Type-Safe Collection Config (WIP)

```typescript
import { createTypedCollectionConfig } from 'payloadcms-typing-supercharge';

export const Users = createTypedCollectionConfig({
  slug: 'users',
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'profiles',
    },
  ],
  access: { // ✅ Typed
    //...
  },
});
```

>[!NOTE]\
> Not all values in the `createTypedCollectionConfig` are type-safe right now.

## ⚡ CLI

- `--in <path>`: The path of your `payload-types.ts`. Default: `./src/payload-types.ts`.
- `--out <dir>`: Output directory to write types. Default: `./src/__generated__/payloadcms-typing-supercharge`.
- `--depth <n>`: Max depth to emit (inclusive from 0..n). Default: `6`.

Examples:

```cmd
payloadcms-typing-supercharge --in ./sample/payload-types.ts --out ./export --depth 2
```

## 🐛 Troubleshooting

n/a

## ⭐ TODO

- [ ] Optimise typed `Where` performance
- [ ] Retype the WHOLE Payload `CollectionConfig`

## 🐛 Known Issues

- n/a

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you want to contribute code, please fork the repository and submit a pull request.

> [!NOTE]\
> Due to the typing loss in the `TypedPayload` class after build process, the package will serve as the orginal typescript source code.

> [!NOTE]\
> TypeScript aliases are not allowed in this project to prevent aliases mapping problem after file copy.
> So make sure to use the relative path for file imports.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## ☕ Donation

Love it? Consider a donation to support my work.

[!["Donation"](https://raw.githubusercontent.com/soranoo/Donation/main/resources/image/DonateBtn.png)](https://github.com/soranoo/Donation) <- click me~
