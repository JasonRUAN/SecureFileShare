# Secure File Share

A secure decentralized file storage & sharing platform base on `Sui` + `Seal` + `Walrus`.

## Project Introduction

Secure File Share is a decentralized file storage and sharing platform based on `Walrus`, using `Seal` for end-to-end encryption technology to ensure file privacy, and `Sui Move` blockchain smart contracts to implement precise access control.

Main features include:
- Users can upload specified files and set up file access control
- Access control types include: private, authorized, and public.
  - `private`: only visible to the upload user, encrypted using Seal;
  - `authorized`: file owners can specify authorized users and set file selling prices, files with selling prices will be listed on the file marketplace and visible to buyers, files in this mode are also encrypted using Seal;
  - `public`: files are not encrypted, directly listed on the file marketplace, all users can freely access their content
- Users can view files they created, files authorized to them, or files they have purchased
- Users can access `public` type files through the file marketplace, or purchase `authorized` files that have a price tag

## Demo

- [PPT](./PPT/SecureFileShare-PPT.pdf)
- testnet：https://securefilesharelab.vercel.app/
- video：https://www.youtube.com/watch?v=70WoEe64Suo