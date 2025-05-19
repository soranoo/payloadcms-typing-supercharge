# PayloadCMS-Typing-Supercharge

Project starts on 18-05-2025

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)&nbsp;&nbsp;&nbsp;[![Donation](https://img.shields.io/static/v1?label=Donation&message=❤️&style=social)](https://github.com/soranoo/Donation)

[![banner](./docs/imgs/banner.png)](https://github.com/soranoo/payloadcms-typing-supercharge)

[![npm version](https://img.shields.io/npm/v/payloadcms-typing-supercharge?color=red&style=flat)](https://www.npmjs.com/package/payloadcms-typing-supercharge) [![npm downloads](https://img.shields.io/npm/dt/payloadcms-typing-supercharge?color=blue&style=flat)](https://www.npmjs.com/package/payloadcms-typing-supercharge)

Give me a ⭐ if you like it.

## 🤔 Why this?

PayloadCMS is a great headless CMS, but its default TypeScript support can be enhanced to provide better type safety and validation. This package supercharges PayloadCMS with:

- Strong type inference for nested queries
- Type-safe field selections
- Enhanced type safety for CRUD operations

## 🗝️ Features

- ✨ **Type Safety Selection**: Type-safe selecting up to any specified depth, not more `string | {collection-object}` at the same time.
- 🎯 **Where Clause Type Safety**: Enhanced type checking for query filters
- 📊 **Sort Type Safety**: Type-safe sort operations with dot notation support
- 🚀 **CRUD Operation Type Safety**: Support the following operations:
  - `find`
  - `findByID`
  - `create`
  - `update` (byID and Bulk)
  - `delete` (byID and Bulk)

## 📦 Requirements

- PayloadCMS >= 3.0.0
- TypeScript >= 5.0.0

## 🚀 Getting Started

### Installation

Install the package using npm:

```bash
npm install payloadcms-typing-supercharge
```

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

## ⭐ TODO

- [ ] Optimise performance

## 🐛 Known Issues

- n/a

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you want to contribute code, please fork the repository and submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## ☕ Donation

Love it? Consider a donation to support my work.

[!["Donation"](https://raw.githubusercontent.com/soranoo/Donation/main/resources/image/DonateBtn.png)](https://github.com/soranoo/Donation) <- click me~
