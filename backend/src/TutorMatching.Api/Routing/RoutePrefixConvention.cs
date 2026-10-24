using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Routing;

namespace TutorMatching.Api.Routing;

public static class MvcOptionsExtensions
{
    public static void UseCentralRoutePrefix(this MvcOptions opts, IRouteTemplateProvider routeAttribute)
    {
        opts.Conventions.Add(new RoutePrefixConvention(routeAttribute));
    }
}

public sealed class RoutePrefixConvention(IRouteTemplateProvider centralPrefix) : IApplicationModelConvention
{
    private readonly AttributeRouteModel _centralPrefix = new(centralPrefix);

    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        {
            var matchedSelectors = controller.Selectors.Where(x => x.AttributeRouteModel != null).ToList();
            if (matchedSelectors.Count > 0)
            {
                foreach (var selectorModel in matchedSelectors)
                {
                    selectorModel.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(
                        _centralPrefix,
                        selectorModel.AttributeRouteModel
                    );
                }
            }
            else
            {
                var unmatchedSelectors = controller.Actions.SelectMany(a => a.Selectors).Where(s => s.AttributeRouteModel != null);
                foreach (var selectorModel in unmatchedSelectors)
                {
                    selectorModel.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(
                        _centralPrefix,
                        selectorModel.AttributeRouteModel
                    );
                }
            }
        }
    }
}