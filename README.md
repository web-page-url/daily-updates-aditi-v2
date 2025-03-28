# Daily Updates for Aditi

A web application for Aditi employees to submit their daily work updates.

## Environment Setup

This project uses environment variables for configuration. Before running the project, you need to set up these variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in the `.env.local` file:
   - **Supabase Configuration**: Your Supabase URL and anonymous key
   - **EmailJS Configuration**: Your EmailJS service ID, template ID, public key, and manager email
   - **Google Sheets Configuration**: Your Google Sheets script URL

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
npm run build
```

To serve the static files locally:

```bash
npx serve out
```

## Features

- Submit daily work updates
- Store updates in Supabase
- Send email notifications
- Integration with Google Sheets

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

### Best Practices
- Component-based architecture
- TypeScript for type safety
- Clean code principles
- Comprehensive error handling
- Regular testing

### Adding New Features
1. Create feature branch
2. Implement changes
3. Add tests
4. Submit PR for review

## Deployment

### Vercel Deployment
1. Connect to GitHub repository
2. Configure environment variables
3. Deploy automatically

```bash
# Manual deployment
vercel
```

### Alternative Deployment
```bash
# Build for production
npm run build

# Serve static files
npx serve out
```

## Future Enhancements

### Planned Features
- Real-time collaboration
- Advanced analytics dashboard
- Custom report generation
- Mobile application
- Integration with project management tools

### Scalability Considerations
- Database optimization
- Load balancing
- Caching implementation
- Performance monitoring

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [EmailJS Documentation](https://www.emailjs.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Submit Pull Request

## Support

For support, email support@aditi.com or join our Slack channel.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

Built with ❤️ by Aditi Development Team
